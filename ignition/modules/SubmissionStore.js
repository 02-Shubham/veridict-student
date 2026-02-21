import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SubmissionStoreModule", (m) => {
    const store = m.contract("SubmissionStore", []);
    return { store };
});
