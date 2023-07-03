import bn from 'bignumber.js';
import { BigNumber } from 'ethers';

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 })



  function encodePriceSqrt(reserve1, reserve0){
    return(
    new bn(reserve1.toString())
    .div(reserve0.toString()).sqrt()
        .mul(new bn(2).pow(96))
        .round(3)
        .toString())
    
  }
  
                // reserve1         ,  reserve0
  console.log(encodePriceSqrt(10, 1))

