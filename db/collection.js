const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TrxDetailedEventsSchema = new Schema(
  {
    eventDisplayType: String,
    baseToken: String,
    quoteToken: String,
    amountInUsd: Number,
    amountOutUsd: Number,
    token0ValueBase: Number,
    token1ValueQuote: Number,
    timestamp: String,
    transactionHash: String,
    maker: String,
    poolAddress: String,
    price: Number,
  },
  { timestamps: true }
);

module.exports = {
  TrxEventDetails: mongoose.model(
    "solana_trx_event_details",
    TrxDetailedEventsSchema
  ),
};