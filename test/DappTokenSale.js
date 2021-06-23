const DappToken = artifacts.require('./DappToken.sol');
const DappTokenSale = artifacts.require("./DappTokenSale.sol");

contract('DappTokenSale', function(accounts) {
    var tokenSaleInstance;
    var tokenInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // in wei
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', function() {
        return DappTokenSale.deployed().then(function(instance) {
          tokenSaleInstance = instance;
          return tokenSaleInstance.address
        }).then(function(address) {
          assert.notEqual(address, 0x0, 'has contract address');
          return tokenSaleInstance.tokenContract();
        }).then(function(address) {
          assert.notEqual(address, 0x0, 'has token contract address');
          return tokenSaleInstance.tokenPrice();
        }).then(function(price) {
            assert.equal(price, tokenPrice, 'token price is correct')
        })
    });

    it('facilitates token buying', function() {
        return DappToken.deployed().then(function(instance) {
            // Grab token instance first
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function(instance) {
            // Then grab token sale instance
            tokenSaleInstance = instance;
            // Provision 75% of all tokens to the token sale
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin })
        }).then(function(receipt) {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function(amount) {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
            return tokenInstance.balanceOf(buyer);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), numberOfTokens);
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
            // Try to buy tokens diffrent from the ether value
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 })
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice })
        }).then(assert.fail).catch(function(error){
            assert(error.message.toString().indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        });
    });

    it('ends token sale', function() {
        return DappToken.deployed().then(function(instance) {
            // Grab token instance first
            tokenInstance = instance;
            return DappTokenSale.deployed();
        }).then(function(instance) {
            // Then grab token sale instance
            tokenSaleInstance = instance;
            // Try to end sale from account other than the admin
            return tokenSaleInstance.endSale({ from: buyer })
        }).then(assert.fail).catch(function(error) {
            assert(error.message.toString().indexOf('revert' >= 0, 'must be admin to end sale'));
            // End sale as admin
            return tokenSaleInstance.endSale({ from: admin });
        }).then(function(receipt) {
            // receipt
            return tokenInstance.balanceOf(admin);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 999990, 'returns all unsold dapp tokens to admin');
            // Check that the contract has no balance
            //balance = web3.eth.getBalance(tokenSaleInstance.address)
            return balance = web3.eth.getBalance(tokenSaleInstance.address);
        }).then(function(balance) {
            assert.equal(balance, 0);
            //assert.equal(balance.toNumber(), 0);
        });
    })

    // it('ends token sale', async () => {
    //     const tokenSaleInstance = await DappTokenSale.deployed()
    //     const tokenInstance = await DappToken.deployed()
    
    //     try {
    //       await tokenSaleInstance.endSale({ from: buyer })
    //     } catch(err) {
    //       assert(err.message.includes('revert'), true, 'just admin can end the token sale')
    //     }
    
    //     const result = await tokenSaleInstance.endSale({ from: admin })
    //     assert.equal(result.receipt.status, true)
    
    //     const balance = await tokenInstance.balanceOf(admin)
    //     assert.equal(balance.toNumber(), 999990, 'returns all unsold token to admin')
    
    //     // Check token price was reset when selfdestructed
    //     const balanceContract = await tokenInstance.balanceOf(tokenSaleInstance.address)
    //     assert.equal(balanceContract.toNumber(), 0, 'token sale balance was set to zero')
    //   })
    
})