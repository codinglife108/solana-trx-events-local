require("dotenv").config();
const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");
const { getAccount, getMint } = require("@solana/spl-token");
const { Program, AnchorProvider } = require("@coral-xyz/anchor");

const { TrxEventDetails } = require("./db/collection");
const IDL = require("./lib/bio_swap.json");
require("./db");

const TOKEN_ADDRESS = new PublicKey(
  "GNH4UcmeGeRbi2p58WdQLoTkz5V18Rtna5kQVYdJZnDE"
);
const programId = new PublicKey("2yVbnztpQWDjwqcmSfs8cMgyoZSw67tZzFbSbwBytEhm");
const connection = new Connection(clusterApiUrl("mainnet-beta"));

const decimal = 1000000000; // 9 of 10

// Get Price in Pool after transaction is complete
const getQuote = async (sourceMint, destinationMint) => {
  try {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const provider = new AnchorProvider(connection, {
      publicKey: new PublicKey("FUg6vdQyauSKCWffzyj8H1k8snSao4TC3oKqUFoRDZQE"),
    });
    const program = new Program(IDL, programId, provider);

    const mintA = new PublicKey(sourceMint);
    const mintB = new PublicKey(destinationMint);
    const swapPair = PublicKey.findProgramAddressSync(
      [Buffer.from("swap-pair", "utf-8"), mintA.toBuffer(), mintB.toBuffer()],
      programId
    )[0];

    const swapPairObject = await program.account.swapPair.fetch(swapPair);
    const tokenAAccount = swapPairObject.tokenAAccount;
    const tokenBAccount = swapPairObject.tokenBAccount;

    const balanceA = await getAccount(connection, tokenAAccount);
    const balanceB = await getAccount(connection, tokenBAccount);

    const tokenMintA = await getMint(connection, mintA);
    const tokenMintB = await getMint(connection, mintB);

    console.log(tokenMintA.decimals, "Token A mint");
    console.log(tokenMintB.decimals, "Token B mint");

    const realBalanceA = String(balanceA.amount) / tokenMintA.decimals;
    const realBalanceB = String(balanceB.amount) / tokenMintB.decimals;

    console.log(realBalanceA, "Token A balance");
    console.log(realBalanceB, "Token B balance");

    console.log(realBalanceB / realBalanceA, "Calculated price");
  } catch (e) {
    console.log(e);
  }
};

// Get the transaction details with signature
async function fetchTransaction(tx) {
  try {
    const transaction = await connection.getTransaction(tx, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 1,
    });

    const { postTokenBalances, preTokenBalances, postBalances, preBalances } =
      transaction.meta;

    const balanceData = [];

    for (let i = 0; i < postTokenBalances.length; i++) {
      if (
        postTokenBalances[i].mint ==
          "So11111111111111111111111111111111111111112" &&
        postTokenBalances[i].uiTokenAmount.amount == 0
      ) {
        continue;
      }
      if (
        postTokenBalances[i].mint ==
        "CGKtv3vELziHAjrDj919yymXxyyhJury37TDQJHuXjSF"
      ) {
        continue;
      }
      const matchedPre = preTokenBalances.find(
        (t) => t.accountIndex == postTokenBalances[i].accountIndex
      );
      balanceData.push({
        mint: postTokenBalances[i].mint,
        owner: postTokenBalances[i].owner,
        postamount: postTokenBalances[i].uiTokenAmount.amount,
        preamount: matchedPre.uiTokenAmount.amount,
      });
    }

    // If First token change amount is minus, it is buy, otherwise it is sell
    const type =
      balanceData[0].postamount - balanceData[0].preamount > 0 ? "buy" : "sell";

    const quoteToken = balanceData.find(
      (t) => t.mint == "So11111111111111111111111111111111111111112"
    );
    const baseAmount = Math.abs(
      balanceData[0].postamount - balanceData[0].preamount
    );
    const quoteAmount = Math.abs(quoteToken.postamount - quoteToken.preamount);
    const price = quoteAmount / baseAmount;

    const saveData = {
      eventDisplayType: type, // buy or sell
      baseToken: balanceData[0].mint, // base token address - index 1 mint
      quoteToken: quoteToken.mint, // quote token address - index 2 mint
      amountInUsd: 0, // base amount usd value
      amountOutUsd: 0, // quote amount usd value
      token0ValueBase: baseAmount / decimal, // base amount
      token1ValueQuote: quoteAmount / decimal, // quote amount
      timestamp: transaction.blockTime, // timestamp
      transactionHash: tx, // transactionHash
      maker: balanceData[0].owner, // creator of trx - index 1 owner
      poolAddress: quoteToken.owner, // poolAddress - index 7 owner
      price: price, // price swapped at
    };

    await TrxEventDetails.create(saveData);
    console.log("Saving transaction data to database...");

    // This is for get price after transaction finalized in pool
    // Here, we can simply update Publickey
    getQuote(
      "BLLbAtSHFpgkSaUGmSQnjafnhebt8XPncaeYrpEgWoVk",
      "So11111111111111111111111111111111111111112"
    );
  } catch (err) {
    console.error(err, "fetchTransaction Error");
  }
}

// Get the latest finalized transactions
async function getRecentTransactions(routerAddress) {
  try {
    const routerPubkey = new PublicKey(routerAddress);
    const signatures = await connection.getConfirmedSignaturesForAddress2(
      routerPubkey,
      { limit: 2 }
    );

    for (let { signature } of signatures) {
      console.log(signature);
      // fetchTransaction(signature);
    }
  } catch (err) {
    console.error(err, "getRecentTransactions Error");
  }
}

// Webhook function to get realtime transactions
function subscribeToTransactions() {
  connection.onLogs(
    TOKEN_ADDRESS,
    (log) => {
      console.log("New transaction log:", log);
      fetchTransaction(log.signature);
    },
    "finalized"
  );
}

async function main() {
  setTimeout(async () => {
    // First time, I tested with this transaction
    // await fetchTransaction(
    //   "5YhEiWHARgyguJ9dSsdCUmQ4S6puuJS2UXGXQK2KQesjqPCwii7iffJBZLMjGfmrnWYfbNXb5dGDmfF7U1Mq99oy"
    // );
    // At first time, we will have to test with recent transactions
    // getRecentTransactions(TOKEN_ADDRESS);
    // When deploy, will enable subscribeToTransactions function to get transaction realtime log
    // subscribeToTransactions();
    // This is for get USDC price for each token
    // getPrice()
  }, 3000);
}

main();
