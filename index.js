const { Connection, PublicKey, clusterApiUrl } = require("@solana/web3.js");

const TOKEN_ADDRESS = "GNH4UcmeGeRbi2p58WdQLoTkz5V18Rtna5kQVYdJZnDE";
// const TOKEN_ADDRESS = "2yVbnztpQWDjwqcmSfs8cMgyoZSw67tZzFbSbwBytEhm";

const connection = new Connection(clusterApiUrl("mainnet-beta"));

require("./db");
const { getPrice } = require("./util");
const { TrxEventDetails } = require("./model");

const decimal = 1000000000 // 9 of 10

async function fetchTransaction(tx) {
  try {
    const transaction = await connection.getTransaction(tx, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 1,
    });

    const { postTokenBalances, preTokenBalances } = transaction.meta;

    const balanceData = []

    for (let i = 0 ; i < postTokenBalances.length; i++) { 
      if (postTokenBalances[i].mint == 'So11111111111111111111111111111111111111112' && postTokenBalances[i].uiTokenAmount.amount == 0) {
        break
      }
      const matchedPre = preTokenBalances.find(t => t.accountIndex == postTokenBalances[i].accountIndex)
      balanceData.push({
        mint: postTokenBalances[i].mint,
        owner: postTokenBalances[i].owner,
        postamount: postTokenBalances[i].uiTokenAmount.amount,
        preamount: matchedPre.uiTokenAmount.amount,
      });
    }

    console.log(balanceData)

    // If First token change amount is minus, it is buy, otherwise it is sell
    const type = balanceData[0].postamount - balanceData[0].preamount > 0 ? 'sell' : 'buy'

    const quoteToken = balanceData.find(t => t.mint == 'So11111111111111111111111111111111111111112')
    const baseAmount = Math.abs(balanceData[0].postamount - balanceData[0].preamount)
    const quoteAmount = Math.abs(quoteToken.postamount - quoteToken.preamount)
    const price = baseAmount / quoteAmount
    const maker = type == 'sell' ? balanceData[0].owner : quoteToken.owner

    const saveData = {
      eventDisplayType: type, // buy or sell
      baseToken: balanceData[0].mint, // base token address - index 1 mint
      quoteToken: quoteAmount.mint, // quote token address - index 2 mint
      amountInUsd: 0, // base amount usd value
      amountOutUsd: 0, // quote amount usd value
      token0ValueBase: baseAmount / decimal, // base amount
      token1ValueQuote: quoteAmount / decimal, // quote amount
      timestamp: transaction.blockTime, // timestamp
      transactionHash: tx, // transactionHash
      maker: maker, // creator of trx - index 1 owner
      poolAddress: balanceData[3].owner, // poolAddress - index 7 owner
      price: price, // price swapped at
    };

    await TrxEventDetails.create(saveData)
    
    console.log("Saving transaction data to database...");
  } catch (err) {
    console.error(err, "fetchTransaction Error");
  }
}

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

function subscribeToTransactions() {
  const publicKey = new PublicKey(TOKEN_ADDRESS);
  connection.onLogs(publicKey, (log) => {
    console.log("New transaction log:", log);
    fetchTransaction(log.signature);
  });
}

async function main() {
  setTimeout(() => {
    // At first time, we will have to test with recent transactions
    // getRecentTransactions(TOKEN_ADDRESS);

    // When deploy, will enable subscribeToTransactions function to get transaction realtime log
    // subscribeToTransactions();
    
    // This is for get USDC price for each token
    // getPrice()

    // First time, I tested with this transaction
    // fetchTransaction('5YhEiWHARgyguJ9dSsdCUmQ4S6puuJS2UXGXQK2KQesjqPCwii7iffJBZLMjGfmrnWYfbNXb5dGDmfF7U1Mq99oy');
  }, 3000);
}

main();
