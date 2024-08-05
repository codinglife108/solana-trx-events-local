exports.getPrice = async () => {
  const res = await fetch(
    "https://price.jup.ag/v4/price?ids=BLLbAtSHFpgkSaUGmSQnjafnhebt8XPncaeYrpEgWoVk,So11111111111111111111111111111111111111112"
  );
  const { data } = await res.json();

  console.log(
    data,
    data["BLLbAtSHFpgkSaUGmSQnjafnhebt8XPncaeYrpEgWoVk"] /
      data["So11111111111111111111111111111111111111112"],
    "updated price"
  );
  // console.log(data["BLLbAtSHFpgkSaUGmSQnjafnhebt8XPncaeYrpEgWoVk"] / data['So11111111111111111111111111111111111111112'], 'updated price')
};
