const chain = hre.network.name;

const implementation = "0x4F572F3Df0bD7ED08917168B1bDe8905382E44E5";

async function main() {
    // Grab the contract factory 
    const MyContract = await ethers.getContractFactory("StreamStakerFactory");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myContract = await MyContract.deploy(implementation); // Instance of the contract 
    console.log("Contract deployed to address:", myContract.address);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });