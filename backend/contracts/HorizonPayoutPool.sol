// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev OpenZeppelin Contracts (v5.0.0) minimal IERC20 interface
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @dev Contract module that provides basic access control mechanisms.
 */
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        require(initialOwner != address(0), "Ownable: initial owner is 0 address");
        _owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is 0 address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

/**
 * @title HorizonPayoutPool
 * @notice Smart Contract Liquidity & Payout Pool for Horizon Capital World.
 * @dev Holds platform USDT reserve pool and disburses instant on-chain payouts to users.
 * Supports dynamic admin address updates and relayer wallet rotation.
 */
contract HorizonPayoutPool is Ownable, ReentrancyGuard {
    // BEP-20 / ERC-20 USDT Token Contract
    IERC20 public immutable usdtToken;

    // Authorized backend relayer address (dispatches automated payouts)
    address public relayerAddress;

    // Operational statistics
    uint256 public totalPayoutsDisbursed;
    uint256 public totalPayoutCount;
    uint256 public totalDepositsReceived;

    // Events for on-chain audit and indexers
    event PayoutProcessed(address indexed to, uint256 amount, uint256 timestamp, string customId);
    event PoolFunded(address indexed funder, uint256 amount, uint256 timestamp);
    event RelayerUpdated(address indexed previousRelayer, address indexed newRelayer);
    event EmergencyWithdrawal(address indexed token, address indexed recipient, uint256 amount);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == relayerAddress, "HorizonPool: Caller is not authorized relayer or owner");
        _;
    }

    /**
     * @param _usdtTokenAddress Address of official USDT contract (BEP-20 / ERC-20)
     * @param _initialRelayer Address of backend authorized relayer
     */
    constructor(address _usdtTokenAddress, address _initialRelayer) Ownable(msg.sender) {
        require(_usdtTokenAddress != address(0), "HorizonPool: Invalid USDT token address");
        require(_initialRelayer != address(0), "HorizonPool: Invalid relayer address");

        usdtToken = IERC20(_usdtTokenAddress);
        relayerAddress = _initialRelayer;
        emit RelayerUpdated(address(0), _initialRelayer);
    }

    /**
     * @notice Deposit USDT into the platform pool reserve.
     * Can be called by Admin or any corporate treasury wallet.
     * @param amount Amount in token units (including decimals)
     */
    function fundPool(uint256 amount) external nonReentrant {
        require(amount > 0, "HorizonPool: Amount must be greater than 0");
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "HorizonPool: Transfer failed");

        totalDepositsReceived += amount;
        emit PoolFunded(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Disburse user withdrawal instantly from Smart Contract Pool.
     * Called automatically by Backend Relayer or Super Admin.
     * @param recipient User's BEP-20 / EVM destination wallet address
     * @param amount Net withdrawal amount in token decimals (e.g. 18 decimals on BSC)
     * @param customId Horizon internal transaction ID for tracking
     */
    function processUserPayout(
        address recipient,
        uint256 amount,
        string calldata customId
    ) external onlyAuthorized nonReentrant {
        require(recipient != address(0), "HorizonPool: Recipient cannot be zero address");
        require(amount > 0, "HorizonPool: Amount must be greater than 0");

        uint256 currentBalance = usdtToken.balanceOf(address(this));
        require(currentBalance >= amount, "HorizonPool: Insufficient USDT balance in contract pool");

        totalPayoutsDisbursed += amount;
        totalPayoutCount += 1;

        require(usdtToken.transfer(recipient, amount), "HorizonPool: USDT payout transfer failed");

        emit PayoutProcessed(recipient, amount, block.timestamp, customId);
    }

    /**
     * @notice Refresh / Update backend relayer address without redeploying contract.
     * Allows admin to rotate automated transaction signing keys anytime.
     * @param _newRelayer New authorized backend wallet address
     */
    function updateRelayerAddress(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "HorizonPool: New relayer cannot be zero address");
        address oldRelayer = relayerAddress;
        relayerAddress = _newRelayer;
        emit RelayerUpdated(oldRelayer, _newRelayer);
    }

    /**
     * @notice Returns current USDT liquidity available in the pool.
     */
    function getPoolBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    /**
     * @notice Emergency extraction of tokens in case of migration or maintenance.
     * Can only be called by the platform owner.
     */
    function emergencyWithdraw(address tokenAddress, uint256 amount) external onlyOwner nonReentrant {
        require(tokenAddress != address(0), "HorizonPool: Invalid token");
        uint256 bal = IERC20(tokenAddress).balanceOf(address(this));
        require(bal >= amount, "HorizonPool: Amount exceeds contract balance");

        require(IERC20(tokenAddress).transfer(owner(), amount), "HorizonPool: Emergency transfer failed");
        emit EmergencyWithdrawal(tokenAddress, owner(), amount);
    }
}
