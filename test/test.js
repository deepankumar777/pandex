const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { keccak256 } = require("@ethersproject/solidity");

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
    it("Create pool,mints position , increases liquidity and decreases liquidity", async function () {
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
      // console.log("events after minting - tokenid",b.events[4].args.tokenId.toString());
      // console.log("events after minting - liquidity",b.events[4].args.liquidity.toString());
      // console.log("events after minting - amount0",b.events[4].args.amount0.toString());
      // console.log("events after minting - amount1",b.events[4].args.amount1.toString());
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
      // console.log("events after increasing liq - tokenid",c.events[3].args.tokenId.toString());
      // console.log("events after  increasing liq- liquidity",c.events[3].args.liquidity.toString());
      // console.log("events after increasing liq - amount0",c.events[3].args.amount0.toString());
      // console.log("events after  increasing liq- amount1",c.events[3].args.amount1.toString());
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



      const decreaseposition = await nftmanagerdeployed.decreaseLiquidity({
        tokenId: 1,
        liquidity : 1000,
        amount0Min: 0,
        amount1Min:0 ,
        deadline: 100000000000000,
      });

      const d = await decreaseposition.wait(1);
      console.log("events after decreasing liq - tokenid ", d.events[1].args.tokenId.toString());
      console.log("events after  decreasing liq- liquidity",d.events[1].args.liquidity.toString());
      console.log("events after decreasing liq - amount0",d.events[1].args.amount0.toString());
      console.log("events after  decreasing liq- amount1",d.events[1].args.amount1.toString());

      console.log("After decreasing TA",await tadeployed.balanceOf(owner.address));
      console.log("After decreasing TB",await tbdeployed.balanceOf(owner.address));
      const position3 = await nftmanagerdeployed.positions(1);
      console.log("After decreasing",position3);

      const collect = await nftmanagerdeployed.collect({
        tokenId : 1,
        recipient: owner.address,
        amount0Max : 2000,
        amount1Max : 1000,
      })

      const e = await collect.wait(1);
      console.log("After collecting TA",await tadeployed.balanceOf(owner.address));
      console.log("After collecting TB",await tbdeployed.balanceOf(owner.address));

      const position4 = await nftmanagerdeployed.positions(1);
      console.log("After collecting",position4);

    });
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