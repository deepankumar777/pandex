const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { keccak256 } = require("@ethersproject/solidity");

const sqrtfn = require("./testing");

describe("Token contract", function () {
  async function deployTokenFixture() {
    console.log("iyf");
    const ta = await ethers.getContractFactory("TokenA");
    const tadeployed = await ta.deploy();
    await tadeployed.deployed();
    console.log(tadeployed.address);

    const tb = await ethers.getContractFactory("TokenB");
    const tbdeployed = await tb.deploy();
    await tbdeployed.deployed();
    console.log(tbdeployed.address);

    const weth = await ethers.getContractFactory("WETH9");
    const wethdeployed = await weth.deploy();
    await wethdeployed.deployed();

    const pd = await ethers.getContractFactory("PancakeV3PoolDeployer");
    const pddeployed = await pd.deploy();
    await pddeployed.deployed();
    console.log("PDDEP", pddeployed.address);

    const factory = await ethers.getContractFactory("PancakeV3Factory");
    const factorydeployed = await factory.deploy(pddeployed.address);
    await factorydeployed.deployed();
    console.log("fa", factorydeployed.address);

    const router = await ethers.getContractFactory("SwapRouter");
    const routerdeployed = await router.deploy(
      pddeployed.address,
      factorydeployed.address,
      wethdeployed.address
    );
    await routerdeployed.deployed();

    const nftmanager = await ethers.getContractFactory(
      "NonfungiblePositionManager"
    );
    const nftmanagerdeployed = await nftmanager.deploy(
      pddeployed.address,
      factorydeployed.address,
      wethdeployed.address,
      wethdeployed.address
    );
    await nftmanagerdeployed.deployed();

    // const pi = await ethers.getContractFactory("PoolInitializer");
    // const pideployed = await pi.deploy();
    // await pideployed.deployed();
    // console.log("PI",pideployed.address)

    // const pool = await ethers.getContractFactory("PancakeV3Pool");
    // const pooldeployed = await pool.connect();
    // // await pooldeployed.deploy();
    // console.log("POOL", pooldeployed.address);

    const [owner, addr1, addr2] = await ethers.getSigners();

    return {
      tadeployed,
      tbdeployed,
      wethdeployed,
      pddeployed,
      factorydeployed,
      routerdeployed,
      nftmanagerdeployed,
      owner,
      addr1,
      addr2,
    };
  }

  describe("Adding liquidity", function () {
    it("Create pool,mints position , increases liquidity, decreases liquidity and collects tokens", async function () {
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);

      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const COMPUTED_INIT_CODE_HASH = keccak256(
        ["bytes"],
        [pool.bytecode]
        );
        console.log("================= pool hash",{ COMPUTED_INIT_CODE_HASH });
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("79228162514264337593543950336")  
      //79224306130848112672356
      //79212423970210941733658
        //"79212423970210941733658")
      //79212423970210941733658
        //"18446744073709551616");
      // eth-usdc sqrt 2198835844819193856025769912483279");
        //7999824471731084);
        
      console.log("owner",owner.address);

        const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveA.wait();

        const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveB.wait();

      const mintposition = await nftmanagerdeployed.mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  -400, //"-276360",
        tickUpper:  400 , //"-276300",    //-276328 < -276360
        amount0Desired: 150,
        amount1Desired: 1500,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const b = await mintposition.wait(1);
      // console.log("events after minting - tokenid",b.events.map(event => ({
      //   tokenId: event.args.tokenId?.toString(),
      //   liquidity: event.args.liquidity?.toString(),
      //   amount0: event.args.amount0?.toString(),
      //   amount1: event.args.amount1?.toString()
      // })));
      console.log("events after minting - tokenid",b.events[6].args.tokenId.toString());
      console.log("events after minting - liquidity",b.events[6].args.liquidity.toString());
      console.log("events after minting - amount0",b.events[6].args.amount0.toString());
      console.log("events after minting - amount1",b.events[6].args.amount1.toString());
      console.log(await tadeployed.balanceOf(owner.address));
      console.log(await tbdeployed.balanceOf(owner.address));
      console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

      const position1 = await nftmanagerdeployed.positions(1);
      console.log("After minting",position1);

      const pos0 = await pooldeployed.balance0();
      console.log("Bal0", pos0);
      const pos1 = await pooldeployed.balance1();
      console.log("Bal1",pos1);

      const increaseposition = await nftmanagerdeployed.increaseLiquidity({
        tokenId: 1,
        amount0Desired: 2500,
        amount1Desired: 250,
        amount0Min: 0,
        amount1Min:0 ,
        deadline: 100000000000000,
      });

      const c = await increaseposition.wait(1);
      console.log("events after increasing liq - tokenid",c.events[5].args.tokenId.toString());
      console.log("events after  increasing liq- liquidity",c.events[5].args.liquidity.toString());
      console.log("events after increasing liq - amount0",c.events[5].args.amount0.toString());
      console.log("events after  increasing liq- amount1",c.events[5].args.amount1.toString());
      console.log("After increasing TA",await tadeployed.balanceOf(owner.address));
      console.log("After increasing TB",await tbdeployed.balanceOf(owner.address));
      console.log("pool ta inc",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb inc",await tbdeployed.balanceOf(pooldeployed.address));
      const position2 = await nftmanagerdeployed.positions(1);
      console.log("After increasing",position2);

      const pos3 = await pooldeployed.balance0();
      console.log("Bal3", pos0);
      const pos4 = await pooldeployed.balance1();
      console.log("Bal4",pos1);



      // const decreaseposition = await nftmanagerdeployed.decreaseLiquidity({
      //   tokenId: 1,
      //   liquidity : 1000,
      //   amount0Min: 0,
      //   amount1Min:0 ,
      //   deadline: 100000000000000,
      // });

      // const d = await decreaseposition.wait(1);
      // console.log("events after decreasing liq - tokenid ", d.events[1].args.tokenId.toString());
      // console.log("events after  decreasing liq- liquidity",d.events[1].args.liquidity.toString());
      // console.log("events after decreasing liq - amount0",d.events[1].args.amount0.toString());
      // console.log("events after  decreasing liq- amount1",d.events[1].args.amount1.toString());

      // console.log("After decreasing TA",await tadeployed.balanceOf(owner.address));
      // console.log("After decreasing TB",await tbdeployed.balanceOf(owner.address));
      // console.log("pool ta dec",await tadeployed.balanceOf(pooldeployed.address));
      // console.log("pool tb dec",await tbdeployed.balanceOf(pooldeployed.address));
      // const position3 = await nftmanagerdeployed.positions(1);
      // console.log("After decreasing",position3);

      // const collect = await nftmanagerdeployed.collect({
      //   tokenId : 1,
      //   recipient: owner.address,
      //   amount0Max : 2000,
      //   amount1Max : 1000,
      // })

      // const e = await collect.wait(1);
      // console.log("After collecting TA",await tadeployed.balanceOf(owner.address));
      // console.log("After collecting TB",await tbdeployed.balanceOf(owner.address));
      // console.log("pool ta coll",await tadeployed.balanceOf(pooldeployed.address));
      // console.log("pool tb coll",await tbdeployed.balanceOf(pooldeployed.address));

      // const position4 = await nftmanagerdeployed.positions(1);
      // console.log("After collecting",position4);

    });

    it("Swaps tokens",async function () {
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);
    
      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const COMPUTED_INIT_CODE_HASH = keccak256(
        ["bytes"],
        [pool.bytecode]
        );
        console.log("================= pool hash",{ COMPUTED_INIT_CODE_HASH });
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("79228162514264337593543950336")  
      //79224306130848112672356
      //79212423970210941733658
        //"79212423970210941733658")
      //79212423970210941733658
        //"18446744073709551616");
      // eth-usdc sqrt 2198835844819193856025769912483279");
        //7999824471731084);
        
      console.log("owner",owner.address);

        const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveA.wait();

        const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveB.wait();

      const mintposition = await nftmanagerdeployed.mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  -400, //"-276360",
        tickUpper:  400 , //"-276300",    //-276328 < -276360
        amount0Desired: 150,
        amount1Desired: 150,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const b = await mintposition.wait(1);
      // console.log("events after minting - tokenid",b.events.map(event => ({
      //   tokenId: event.args.tokenId?.toString(),
      //   liquidity: event.args.liquidity?.toString(),
      //   amount0: event.args.amount0?.toString(),
      //   amount1: event.args.amount1?.toString()
      // })));
      console.log("events after minting - tokenid",b.events[6].args.tokenId.toString());
      console.log("events after minting - liquidity",b.events[6].args.liquidity.toString());
      console.log("events after minting - amount0",b.events[6].args.amount0.toString());
      console.log("events after minting - amount1",b.events[6].args.amount1.toString());
      console.log(await tadeployed.balanceOf(owner.address));
      console.log(await tbdeployed.balanceOf(owner.address));
      console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

      const position1 = await nftmanagerdeployed.positions(1);
      console.log("After minting",position1);

      const pos0 = await pooldeployed.balance0();
      console.log("Bal0", pos0);
      const pos1 = await pooldeployed.balance1();
      console.log("Bal1",pos1);

      const increaseposition = await nftmanagerdeployed.increaseLiquidity({
        tokenId: 1,
        amount0Desired: 2500,
        amount1Desired: 2500,
        amount0Min: 0,
        amount1Min:0 ,
        deadline: 100000000000000,
      });

      const c = await increaseposition.wait(1);

      console.log("events after increasing liq - tokenid",c.events[5].args.tokenId.toString());
      console.log("events after  increasing liq- liquidity",c.events[5].args.liquidity.toString());
      console.log("events after increasing liq - amount0",c.events[5].args.amount0.toString());
      console.log("events after  increasing liq- amount1",c.events[5].args.amount1.toString());
      console.log("After increasing TA",await tadeployed.balanceOf(owner.address));
      console.log("After increasing TB",await tbdeployed.balanceOf(owner.address));
      console.log("pool ta inc",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb inc",await tbdeployed.balanceOf(pooldeployed.address));
      const position2 = await nftmanagerdeployed.positions(1);
      console.log("After increasing",position2);


      //const send = await tadeployed.transfer(routerdeployed.address,100);
      console.log("swaprouter ta bal before swap", await tadeployed.balanceOf(routerdeployed.address));
      console.log("swaprouter ta bal before swap", await tbdeployed.balanceOf(routerdeployed.address));
      console.log("owner ta bal before swap", await tadeployed.balanceOf(owner.address));
      console.log("owner tb bal before swap", await tbdeployed.balanceOf(owner.address));



      const approveta = await tadeployed.approve(routerdeployed.address,100);
     const swapipsingle = await routerdeployed.exactInputSingle({
      tokenIn : tadeployed.address,
      tokenOut: tbdeployed.address,
      fee: 2500,
      recipient: owner.address,
      deadline: 100000000000000,
      amountIn: 100,
      amountOutMinimum: 50,
      sqrtPriceLimitX96: 0,
     })

    const abc = await swapipsingle.wait(1);
    console.log(abc.events);
     console.log("swaprouter ta bal after swap", await tadeployed.balanceOf(routerdeployed.address));
     console.log("swaprouter ta bal after swap", await tbdeployed.balanceOf(routerdeployed.address));
     console.log("owner ta bal after swap", await tadeployed.balanceOf(owner.address));
     console.log("owner tb bal after swap", await tbdeployed.balanceOf(owner.address));


     //await swapipsingle.wait();
     //console.log(swapipsingle);
    
    //const sendtb = await tbdeployed.transfer(routerdeployed.address,1000);
     
    
    const approvetb = await tbdeployed.approve(routerdeployed.address,1000);
     const swapopsingle = await routerdeployed.exactOutputSingle({
      tokenIn : tbdeployed.address,
      tokenOut: tadeployed.address,
      fee: 2500,
      recipient: owner.address,
      deadline: 100000000000000,
      amountOut: 100,
      amountInMaximum: 200,
      sqrtPriceLimitX96: 0,
     })
     console.log("Second swap");
     console.log("swaprouter ta bal after swap", await tadeployed.balanceOf(routerdeployed.address));
     console.log("owner ta bal after swap", await tadeployed.balanceOf(owner.address));
     console.log("owner tb bal after swap", await tbdeployed.balanceOf(owner.address));

    })

    it.skip("Multihop swap", async function() {

      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);

      const tc = await ethers.getContractFactory("TokenC");
      const tcdeployed = await tc.deploy();
      await tcdeployed.deployed();
      console.log("TokenC",tcdeployed.address);

      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress0 = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a0 = await pooladdress0.wait(1);
      console.log("PA", a0.events[0].args.pool);
      const add0 = a0.events[0].args.pool;
      console.log("pa", add0);

      const pool0 = await ethers.getContractFactory("PancakeV3Pool");
      
      const pooldeployed0 = await pool0.attach(add0);
      console.log("POOL", pooldeployed0.address);
      console.log("tsp", await pooldeployed0.tickSpacing());
      await pooldeployed0.initialize("79228162514264337593543950336")  
      console.log("tsp2", await pooldeployed0.tickSpacing());


      const pooladdress = await factorydeployed.createPool(
        tbdeployed.address,
        tcdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("79228162514264337593543950336")  

      const letsapproveA = await tadeployed.approve(routerdeployed.address,10000);
      letsapproveA.wait();


      console.log("Before swap");
      console.log("TA bal before swap", await tadeployed.balanceOf(owner.address))
      console.log("TC bal before swap", await tcdeployed.balanceOf(owner.address))
      const abi = ethers.utils.defaultAbiCoder;
        console.log("owner",owner.address);
      // const multiswap = await routerdeployed.exactInput({
      //    //path: abi.encode(["uint256","uint24","uint256","uint24","uint256"],[tadeployed.address,2500,tbdeployed.address,2500,tcdeployed.address]),
      //    path : ethers.utils.concat([ethers.utils.arrayify(tadeployed.address),ethers.utils.solidityPack(["uint24"],["2500"]),ethers.utils.arrayify(tbdeployed.address),ethers.utils.solidityPack(["uint24"],["2500"]),ethers.utils.arrayify(tcdeployed.address)]),
      //    recipient: owner.address,
      //    deadline: 100000000000000,
      //    amountIn: 150 ,
      //    amountOutMinimum: 50,
      // })

      // console.log("After swap");
      // console.log("TA bal after swap", await tadeployed.balanceOf(owner.address))
      // console.log("TC bal after swap", await tcdeployed.balanceOf(owner.address))
    })

    it("another user adding liquidity", async function(){
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);
    
      console.log("ta deci",await tadeployed.decimals())
      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("79228162514264337593543950336")  
      console.log("owner",owner.address);

        const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveA.wait();

        const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveB.wait();

        const sendtatoaddr1 = await tadeployed.transfer(addr1.address,1000);
        sendtatoaddr1.wait();

        const sendtbtoaddr1 = await tbdeployed.transfer(addr1.address,1000);
        sendtbtoaddr1.wait();

        
      const mintposition = await nftmanagerdeployed.mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  -400, //"-276360",
        tickUpper:  400 , //"-276300",    //-276328 < -276360
        amount0Desired: 100,
        amount1Desired: 100,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const b = await mintposition.wait(1);
      console.log("events after minting - tokenid",b.events[6].args.tokenId.toString());
      console.log("events after minting - liquidity",b.events[6].args.liquidity.toString());
      console.log("events after minting - amount0",b.events[6].args.amount0.toString());
      console.log("events after minting - amount1",b.events[6].args.amount1.toString());
      console.log(await tadeployed.balanceOf(owner.address));
      console.log(await tbdeployed.balanceOf(owner.address));
      console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

      const position1 = await nftmanagerdeployed.positions(1);
      console.log("After minting",position1);

      const pos0 = await pooldeployed.balance0();
      console.log("Bal0", pos0);
      const pos1 = await pooldeployed.balance1();
      console.log("Bal1",pos1);

      console.log("addr1 balance");
      console.log(await tadeployed.balanceOf(addr1.address));
      console.log(await tbdeployed.balanceOf(addr1.address));

      const approvenftmanageraddr1ta = await tadeployed.connect(addr1).approve(nftmanagerdeployed.address,1000);
      const approvenftmanageraddr1tb = await tbdeployed.connect(addr1).approve(nftmanagerdeployed.address,1000);

      const mintpositionsecondaddress = await nftmanagerdeployed.connect(addr1).mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  -200, //"-276360",
        tickUpper:  200 , //"-276300",    //-276328 < -276360
        amount0Desired: 150,
        amount1Desired: 150,
        amount0Min: 0,
        amount1Min: 0,
        recipient: addr1.address,
        deadline: 100000000000000,
      });
      const b1 = await mintpositionsecondaddress.wait(1);
      console.log("events after minting addr1- tokenid",b1.events[6].args.tokenId.toString());
      console.log("events after minting - liquidity",b1.events[6].args.liquidity.toString());
      console.log("events after minting - amount0",b1.events[6].args.amount0.toString());
      console.log("events after minting - amount1",b1.events[6].args.amount1.toString());
      console.log(await tadeployed.balanceOf(addr1.address));
      console.log(await tbdeployed.balanceOf(addr1.address));
      console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

      const position2 = await nftmanagerdeployed.positions(2);
      console.log("After minting",position2);

      const pos2 = await pooldeployed.balance0();
      console.log("Bal0", pos2);
      const pos3 = await pooldeployed.balance1();
      console.log("Bal1",pos3);

    })

    it.skip("can add liquidity for same ticklower and tickupper", async function(){
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);
    
      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("79228162514264337593543950336")  
      console.log("owner",owner.address);

        const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveA.wait();

        const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveB.wait();
        
      const mintposition = await nftmanagerdeployed.mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  100, //"-276360",
        tickUpper:  100 , //"-276300",    //-276328 < -276360
        amount0Desired: 100,
        amount1Desired: 100,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const b = await mintposition.wait(1);
      // console.log("events after minting - tokenid",b.events[6].args.tokenId.toString());
      // console.log("events after minting - liquidity",b.events[6].args.liquidity.toString());
      // console.log("events after minting - amount0",b.events[6].args.amount0.toString());
      // console.log("events after minting - amount1",b.events[6].args.amount1.toString());
      console.log(await tadeployed.balanceOf(owner.address));
      console.log(await tbdeployed.balanceOf(owner.address));
      console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
      console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

      const position1 = await nftmanagerdeployed.positions(1);
      console.log("After minting",position1);

      const pos0 = await pooldeployed.balance0();
      console.log("Bal0", pos0);
      const pos1 = await pooldeployed.balance1();
      console.log("Bal1",pos1);

      console.log("addr1 balance");
      console.log(await tadeployed.balanceOf(addr1.address));
      console.log(await tbdeployed.balanceOf(addr1.address));

    })

    it("setting customised price ",async function(){
      
        const {
          tadeployed,
          tbdeployed,
          wethdeployed,
          pddeployed,
          factorydeployed,
          routerdeployed,
          nftmanagerdeployed,
          owner,
          addr1,
          addr2,
        } = await loadFixture(deployTokenFixture);
      
        const setaddress = await pddeployed.setFactoryAddress(
          factorydeployed.address
        );
        setaddress.wait();
  
        const pooladdress = await factorydeployed.createPool(
          tadeployed.address,
          tbdeployed.address,
          2500
        );
  
        const a = await pooladdress.wait(1);
        console.log("PA", a.events[0].args.pool);
        const add = a.events[0].args.pool;
        console.log("pa", add);
  
        const pool = await ethers.getContractFactory("PancakeV3Pool");
        const pooldeployed = await pool.attach(add);
        console.log("POOL", pooldeployed.address);
        console.log("tsp", await pooldeployed.tickSpacing());
        await pooldeployed.initialize("25052894984021797146183221489")
        //demo value for 5 - 177159557114295710296101716160
        // compiler - 250541448375047946302209916928") 
        //demo -                       25052894984021797146183221489") 
        //sqrt of 0.1 *2^96 = 12163291392166510000000000
        //792281625142643375935439503360");
        // sqrt of 0.1*2**96 = 11,175,870,895,385,744
        //sqrt of 10 *2 **48= 281474976710656")
        // sqrt of 10 * 2**96 = 888178419700125") 
        //7993608916637051548953668721995961280")
        // 
        console.log("owner",owner.address);
  
          const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
          letsapproveA.wait();
  
          const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
          letsapproveB.wait();
  
        const mintposition = await nftmanagerdeployed.mint({
          token0: tadeployed.address,
          token1: tbdeployed.address,
          fee: 2500,
          tickLower:  -24850 ,  //16000, // , //"-276360",
          tickUpper:  -20800,   //16200, //, //"-276300",    //-276328 < -276360
          amount0Desired: 1250,
          amount1Desired: 100,
          amount0Min: 0,
          amount1Min: 0,
          recipient: owner.address,
          deadline: 100000000000000,
        });
        const b = await mintposition.wait(1);
       
        // console.log("events after minting - tokenid",b.events[6].args.tokenId.toString());
        // console.log("events after minting - liquidity",b.events[6].args.liquidity.toString());
        // console.log("events after minting - amount0",b.events[6].args.amount0.toString());
        // console.log("events after minting - amount1",b.events[6].args.amount1.toString());
        console.log(await tadeployed.balanceOf(owner.address));
        console.log(await tbdeployed.balanceOf(owner.address));
        console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
        console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));
  
        const position1 = await nftmanagerdeployed.positions(1);
        console.log("After minting",position1);
  
        const pos0 = await pooldeployed.balance0();
        console.log("Bal0", pos0);
        const pos1 = await pooldeployed.balance1();
        console.log("Bal1",pos1);
  
        // const increaseposition = await nftmanagerdeployed.increaseLiquidity({
        //   tokenId: 1,
        //   amount0Desired: 100,
        //   amount1Desired: 3000,
        //   amount0Min: 0,
        //   amount1Min:0 ,
        //   deadline: 100000000000000,
        // });
  
        // const c = await increaseposition.wait(1);
  
        // console.log("events after increasing liq - tokenid",c.events[5].args.tokenId.toString());
        // console.log("events after  increasing liq- liquidity",c.events[5].args.liquidity.toString());
        // console.log("events after increasing liq - amount0",c.events[5].args.amount0.toString());
        // console.log("events after  increasing liq- amount1",c.events[5].args.amount1.toString());
        // console.log("After increasing TA",await tadeployed.balanceOf(owner.address));
        // console.log("After increasing TB",await tbdeployed.balanceOf(owner.address));
        // console.log("pool ta inc",await tadeployed.balanceOf(pooldeployed.address));
        // console.log("pool tb inc",await tbdeployed.balanceOf(pooldeployed.address));
        // const position2 = await nftmanagerdeployed.positions(1);
        // console.log("After increasing",position2);
  
  
        //const send = await tadeployed.transfer(routerdeployed.address,100);
        console.log("swaprouter ta bal before swap", await tadeployed.balanceOf(routerdeployed.address));
        console.log("swaprouter ta bal before swap", await tbdeployed.balanceOf(routerdeployed.address));
        console.log("owner ta bal before swap", await tadeployed.balanceOf(owner.address));
        console.log("owner tb bal before swap", await tbdeployed.balanceOf(owner.address));
  
  
  
        const approveta = await tbdeployed.approve(routerdeployed.address,1000);
        const swapipsingle = await routerdeployed.exactInputSingle({
          tokenIn : tbdeployed.address,
          tokenOut: tadeployed.address,
          fee: 2500,
          recipient: owner.address,
          deadline: 100000000000000,
          amountIn: 30,
          amountOutMinimum: 0,
          sqrtPriceLimitX96: 0,
         })
    
      
         console.log("swaprouter ta bal after swap", await tadeployed.balanceOf(routerdeployed.address));
         console.log("swaprouter ta bal after swap", await tbdeployed.balanceOf(routerdeployed.address));
         console.log("owner ta bal after swap", await tadeployed.balanceOf(owner.address));
         console.log("owner tb bal after swap", await tbdeployed.balanceOf(owner.address));
    
      })

    it.skip("sqrtpricex96", async function(){
        console.log(sqrtfn(3,1).toString());
     })

     it.only("multi hop swap",async function(){
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);
    
      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();

      const pooladdress = await factorydeployed.createPool(
        tadeployed.address,
        tbdeployed.address,
        2500
      );

      const a = await pooladdress.wait(1);
      console.log("PA", a.events[0].args.pool);
      const add = a.events[0].args.pool;
      console.log("pa", add);

      const pool = await ethers.getContractFactory("PancakeV3Pool");
      const pooldeployed = await pool.attach(add);
      console.log("POOL", pooldeployed.address);
      console.log("tsp", await pooldeployed.tickSpacing());
      await pooldeployed.initialize("25052894984021797146183221489")
      //demo value for 5 - 177159557114295710296101716160
      // compiler - 250541448375047946302209916928") 
      //demo -                       25052894984021797146183221489") 
      //sqrt of 0.1 *2^96 = 12163291392166510000000000
      //792281625142643375935439503360");
      // sqrt of 0.1*2**96 = 11,175,870,895,385,744
      //sqrt of 10 *2 **48= 281474976710656")
      // sqrt of 10 * 2**96 = 888178419700125") 
      //7993608916637051548953668721995961280")
      // 
      console.log("owner",owner.address);

        const letsapproveA = await tadeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveA.wait();

        const letsapproveB = await tbdeployed.approve(nftmanagerdeployed.address,10000);
        letsapproveB.wait();

      const mintposition = await nftmanagerdeployed.mint({
        token0: tadeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  -24850 ,  //16000, // , //"-276360",
        tickUpper:  -20800,   //16200, //, //"-276300",    //-276328 < -276360
        amount0Desired: 6000,
        amount1Desired: 500,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const b = await mintposition.wait(1);
     

     console.log(await tadeployed.balanceOf(owner.address));
     console.log(await tbdeployed.balanceOf(owner.address));
     console.log("pool ta",await tadeployed.balanceOf(pooldeployed.address));
     console.log("pool tb",await tbdeployed.balanceOf(pooldeployed.address));

     const position1 = await nftmanagerdeployed.positions(1);
     console.log("After minting",position1);

     const tc = await ethers.getContractFactory("TokenC");
     const tcdeployed = await tc.deploy();
     await tcdeployed.deployed();
     console.log("Tokena",tadeployed.address);
     console.log("TokenB", tbdeployed.address);
     console.log("TokenC",tcdeployed.address);

     const pooladdress0 = await factorydeployed.createPool(
      tbdeployed.address,
      tcdeployed.address,
      2500
    );

    const x = await pooladdress0.wait(1);
    console.log("PA", x.events[0].args.pool);
    const addagain = x.events[0].args.pool;
    console.log("pa", addagain);

      const poolagain = await ethers.getContractFactory("PancakeV3Pool");
      const pooldeployedagain = await poolagain.attach(addagain);
      console.log("POOL", pooldeployedagain.address);
      console.log("tsp", await pooldeployedagain.tickSpacing());
      await pooldeployedagain.initialize("177157928842132501967358423881")  

      const letsapproveBagain = await tbdeployed.approve(nftmanagerdeployed.address,10000);
      letsapproveBagain.wait();
      const letsapproveC= await tcdeployed.approve(nftmanagerdeployed.address,10000);
      letsapproveBagain.wait();
      const letsapproveAforrouter = await tadeployed.approve(routerdeployed.address,10000);
      letsapproveAforrouter.wait();
      const letsapproveCforrouter = await tcdeployed.approve(routerdeployed.address,10000);
      letsapproveCforrouter.wait();

      const mintpositionagain = await nftmanagerdeployed.mint({
        token0: tcdeployed.address,
        token1: tbdeployed.address,
        fee: 2500,
        tickLower:  16000 ,  //16000, // , //"-276360",
        tickUpper:  16200,   //16200, //, //"-276300",    //-276328 < -276360
        amount0Desired: 100,
        amount1Desired: 1250,
        amount0Min: 0,
        amount1Min: 0,
        recipient: owner.address,
        deadline: 100000000000000,
      });
      const y = await mintpositionagain.wait(1);

      console.log("pool tb",await tbdeployed.balanceOf(pooldeployedagain.address));
      console.log("pool tc",await tcdeployed.balanceOf(pooldeployedagain.address));

      console.log("Before swap");
      console.log("TA bal before swap", await tadeployed.balanceOf(owner.address))
      console.log("TB bal before swap", await tbdeployed.balanceOf(owner.address))
      console.log("TC bal before swap", await tcdeployed.balanceOf(owner.address))
      const abi = ethers.utils.defaultAbiCoder;
      console.log("owner",owner.address);

       const multiswap = await routerdeployed.exactInput({
         path : ethers.utils.concat([ethers.utils.arrayify(tcdeployed.address),ethers.utils.solidityPack(["uint24"],["2500"]),ethers.utils.arrayify(tbdeployed.address),ethers.utils.solidityPack(["uint24"],["2500"]),ethers.utils.arrayify(tadeployed.address)]),
         recipient: owner.address,
         deadline: 100000000000000,
         amountIn: 300 ,
         amountOutMinimum: 0,
      })
      multiswap.wait();

      console.log("After swap");
      console.log("TA bal after swap", await tadeployed.balanceOf(owner.address))
      console.log("TB bal after swap", await tbdeployed.balanceOf(owner.address))
      console.log("TC bal after swap", await tcdeployed.balanceOf(owner.address))

    })

    it("Swaps token c",async function () {
      const {
        tadeployed,
        tbdeployed,
        wethdeployed,
        pddeployed,
        factorydeployed,
        routerdeployed,
        nftmanagerdeployed,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployTokenFixture);

      const setaddress = await pddeployed.setFactoryAddress(
        factorydeployed.address
      );
      setaddress.wait();const tc = await ethers.getContractFactory("TokenC");
      const tcdeployed = await tc.deploy();
      await tcdeployed.deployed();
      console.log("TokenC",tcdeployed.address);

      
 
      const pooladdress0 = await factorydeployed.createPool(
       tbdeployed.address,
       tcdeployed.address,
       2500
     );
 
     const x = await pooladdress0.wait(1);
     console.log("PA", x.events[0].args.pool);
     const addagain = x.events[0].args.pool;
     console.log("pa", addagain);
 
       const poolagain = await ethers.getContractFactory("PancakeV3Pool");
       const pooldeployedagain = await poolagain.attach(addagain);
       console.log("POOL", pooldeployedagain.address);
       console.log("tsp", await pooldeployedagain.tickSpacing());
       await pooldeployedagain.initialize("177157928842132501967358423881")









    })


  });
});


// struct IncreaseLiquidityParams {
//   uint256 tokenId;
//   uint256 amount0Desired;
//   uint256 amount1Desired;
//   uint256 amount0Min;
//   uint256 amount1Min;
//   uint256 deadline;
// }

// it("Add Liquidity", async function () {
//   const {
//     tadeployed,
//     tbdeployed,
//     wethdeployed,
//     pddeployed,
//     factorydeployed,
//     routerdeployed,
//     nftmanagerdeployed,
//     pooldeployed,
//     owner,
//     addr1,
//     addr2,
//   } = await loadFixture(deployTokenFixture);

// )

//});

//await pooldeployed.connect(add).initialize(123);

//})

//6798244717310842702263858010 = 0.00736265448
//79998244717310842702263858011 = 1.01953408239
//2198835844819193856025769912483279
//});
//});
// 79307988514299295074366 - usdc/dai sqrtpricex96 

// sqrtRatioX96 ** 2 / 2 ** 192 = price
