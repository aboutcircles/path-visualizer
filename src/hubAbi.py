hub_abi = [{"type":"constructor","stateMutability":"nonpayable","inputs":[{"type":"uint256","name":"_inflation","internalType":"uint256"},{"type":"uint256","name":"_period","internalType":"uint256"},{"type":"string","name":"_symbol","internalType":"string"},{"type":"string","name":"_name","internalType":"string"},{"type":"uint256","name":"_signupBonus","internalType":"uint256"},{"type":"uint256","name":"_initialIssuance","internalType":"uint256"},{"type":"uint256","name":"_timeout","internalType":"uint256"}]},{"type":"event","name":"HubTransfer","inputs":[{"type":"address","name":"from","internalType":"address"},{"type":"address","name":"to","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"event","name":"OrganizationSignup","inputs":[{"type":"address","name":"organization","internalType":"address","indexed":True}],"anonymous":False},{"type":"event","name":"Signup","inputs":[{"type":"address","name":"user","internalType":"address","indexed":True},{"type":"address","name":"token","internalType":"address","indexed":False}],"anonymous":False},{"type":"event","name":"Trust","inputs":[{"type":"address","name":"canSendTo","internalType":"address","indexed":True},{"type":"address","name":"user","internalType":"address","indexed":True},{"type":"uint256","name":"limit","internalType":"uint256","indexed":False}],"anonymous":False},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"checkSendLimit","inputs":[{"type":"address","name":"tokenOwner","internalType":"address"},{"type":"address","name":"src","internalType":"address"},{"type":"address","name":"dest","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"deployedAt","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"divisor","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"inflate","inputs":[{"type":"uint256","name":"_initial","internalType":"uint256"},{"type":"uint256","name":"_periods","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"inflation","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"initialIssuance","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"issuance","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"issuanceByStep","inputs":[{"type":"uint256","name":"_periods","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"limits","inputs":[{"type":"address","name":"","internalType":"address"},{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"name","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"organizationSignup","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"organizations","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"period","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"periods","inputs":[]},{"type":"function","stateMutability":"pure","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"pow","inputs":[{"type":"uint256","name":"base","internalType":"uint256"},{"type":"uint256","name":"exponent","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"seen","inputs":[{"type":"uint256","name":"","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"signup","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"signupBonus","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"symbol","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"timeout","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"tokenToUser","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"transferThrough","inputs":[{"type":"address[]","name":"tokenOwners","internalType":"address[]"},{"type":"address[]","name":"srcs","internalType":"address[]"},{"type":"address[]","name":"dests","internalType":"address[]"},{"type":"uint256[]","name":"wads","internalType":"uint256[]"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"trust","inputs":[{"type":"address","name":"user","internalType":"address"},{"type":"uint256","name":"limit","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"contract Token"}],"name":"userToToken","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"bool","name":"seen","internalType":"bool"},{"type":"uint256","name":"sent","internalType":"uint256"},{"type":"uint256","name":"received","internalType":"uint256"}],"name":"validation","inputs":[{"type":"address","name":"","internalType":"address"}]}]
