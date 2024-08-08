# Detect Transaction Event

## Tech Stacks

Nodejs 18.20
Mongodb 7.0

## Functions

1. subscribeToTransactions function get transaction realtime log of transaction
2. fetchTransaction function will get details of transaction and save to database
3. getRecentTransactions function will get recent transactions and save transaction signature to TrxEvents collection
4. updateTransactionDetails function will check transaction signature that's status is not saved detail to db per every 1 minute

