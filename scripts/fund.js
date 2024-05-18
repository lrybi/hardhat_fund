
const { ethers, getNamedAccounts } = require("hardhat")

async function main() { 
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log(`Got contract FundMe at ${await fundMe.getAddress()}`)
    console.log("Funding Contract...");
    const transactionResponse = await fundMe.fund({ value: ethers.parseEther("0.1") });
    await transactionResponse.wait(1);
    console.log("Funded!");

}

main()
    .then(() => process.exit(0)) 
    .catch((error) => { 
    console.error(error); 
    process.exit(1); 
})
