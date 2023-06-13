const {ethers} = require('hardhat')
async function main() {

  const ta = await ethers.getContractFactory("TokenA");
  const tadeployed = await ta.deploy();
  await tadeployed.deployed();
  console.log("TokenA",tadeployed.address);
  
  const tb = await ethers.getContractFactory("TokenB");
  const tbdeployed = await tb.deploy();
  await tbdeployed.deployed();
  console.log("TokenB",tbdeployed.address);
  
  
  const weth = await ethers.getContractFactory("WETH9");
  const wethdeployed = await weth.deploy();
  await wethdeployed.deployed();
  console.log("weth",wethdeployed.address);

  const pd = await ethers.getContractFactory("PancakeV3PoolDeployer")
  const pddeployed = await pd.deploy();
  await pddeployed.deployed();
  console.log("pd", pddeployed.address )
  
  const factory = await ethers.getContractFactory("PancakeV3Factory");
  const factorydeployed = await factory.deploy(pddeployed.address);
  await factorydeployed.deployed();
  console.log("factory",factorydeployed.address);

  const router = await ethers.getContractFactory("SwapRouter");
  const routerdeployed = await router.deploy("0xbaBC8ac93F69aA381FC1288d2e176052a04068B9",factorydeployed.address, wethdeployed.address);
  await routerdeployed.deployed();
  console.log("router",routerdeployed.address);

  const nftmanager = await ethers.getContractFactory("NonfungiblePositionManager");
  const nftmanagerdeployed = await nftmanager.deploy("0xbaBC8ac93F69aA381FC1288d2e176052a04068B9",factorydeployed.address, wethdeployed.address,wethdeployed.address);
  await nftmanagerdeployed.deployed();
  console.log("Nftmanager",nftmanagerdeployed.address);


}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});