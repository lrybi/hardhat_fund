
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error FundMe__NotOwner(); 
/**
 * @title A contract for crowd funding 
 * @author ThinhLe
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {

    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders; 
    
    mapping(address => uint256) private s_addressToAmountFunded;

    address private immutable i_owner; 

    AggregatorV3Interface private s_priceFeed;

    modifier onlyOwner {
        if(msg.sender != i_owner) { revert FundMe__NotOwner(); } 

        _; 
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @notice This function funds this contract
     */
    function fund() public payable {
        
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH!"); // (có thể dùng hàm if với revert để tiết kiệm gas hơn (vì không phải lưu trữ đoạn string "You need to spend more ETH!"))
    
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);

    }

    function withdraw() public onlyOwner {
        
        
        address[] memory funders = s_funders;
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) 
        {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0); 
            
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed"); 
    }

    function getOwner() public view returns (address) { 
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(address funder) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

}
