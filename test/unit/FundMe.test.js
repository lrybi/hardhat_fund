
const { deployments, getNamedAccounts, ethers } = require("hardhat");
   
const { assert, expect } = require("chai");
const { developmentChain } = require("../../helper-hardhat-config")

!developmentChain.includes(network.name) 
    ? describe.skip 
    : describe("FundMe", function () {
        let fundMe;
        let mockV3Aggregator
        let deployer;
        const sendValue = ethers.parseEther("1"); 
        beforeEach(async function () { 
            
            deployer = (await getNamedAccounts()).deployer;
            
            await deployments.fixture(["all"]);
                
            fundMe = await ethers.getContract("FundMe", deployer);
                
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        });

        describe("constructor", function () {
            it("sets the aggregator addresses correctly", async function () {
                const response = await fundMe.getPriceFeed(); 
                assert.equal(response, await mockV3Aggregator.getAddress()) 
            })
        });

        describe("fund", function () {
            it("Fails if you don't send enough ETH", async function () {
                await expect(fundMe.fund({ value: (ethers.parseEther("0.0000000000001")) })).to.be.revertedWith("You need to spend more ETH!");
            })
            it("Updated the amount funded data structure", async function () {
                await fundMe.fund({ value: sendValue });
                const response = await fundMe.getAddressToAmountFunded(deployer);
                assert.equal(response.toString(), sendValue.toString());
            })
            it("Adds funder to array of funders", async function () {
                await fundMe.fund({ value: sendValue });
                const funder = await fundMe.getFunder(0);
                assert.equal(funder, deployer);
            });
        })

        describe("withdraw", function () {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue });
            });

            it("Withdraws ETH from a single funder", async function () {
                const startingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress()); // (nó sẽ trả về bigint)
                const startingDeployerBalance = await ethers.provider.getBalance(deployer);
                    
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, gasPrice } = transactionReceipt
                const gasCost = gasUsed * gasPrice; 
                const endingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress());
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                    
                assert.equal(endingFundMeBalance, 0);
                assert.equal((startingFundMeBalance + startingDeployerBalance).toString(), (endingDeployerBalance + gasCost).toString());
            })
            it("is allows us to withdraw with multiple funders", async function () {
                const accounts = await ethers.getSigners();
                for (let i = 1; i < 6; i++) { 
                    const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                    await fundMeConnectedContract.fund({ value: sendValue });
                }
                const startingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress()); // (nó sẽ trả về bigint)
                const startingDeployerBalance = await ethers.provider.getBalance(deployer);

                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, gasPrice } = transactionReceipt
                const gasCost = gasUsed * gasPrice; 
                const endingFundMeBalance = await ethers.provider.getBalance(await fundMe.getAddress());
                const endingDeployerBalance = await ethers.provider.getBalance(deployer);
                
                // Assert
                assert.equal(endingFundMeBalance, 0);
                assert.equal((startingFundMeBalance + startingDeployerBalance).toString(), (endingDeployerBalance + gasCost).toString());
                
                await expect(fundMe.getFunder(0)).to.be.reverted;
                for (i = 1; i < 6; i++){
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i]), 0);
                }
            })
            it("Only allows the owner to withdraw", async function () {
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attakerConnectedContract = await fundMe.connect(attacker);
                await expect(attakerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner");
            })
        })

    });
