// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SubmissionStore {
    event HashStored(string examId, string submissionHash, uint256 timestamp);

    function storeSubmissionHash(string memory examId, string memory submissionHash) public {
        emit HashStored(examId, submissionHash, block.timestamp);
    }
}
