export const ABI = [
        {
          "type": "function",
          "name": "multi_route_swap",
          "inputs": [
            {
              "name": "token_from_address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_from_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "token_to_address",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "token_to_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "token_to_min_amount",
              "type": "core::integer::u256"
            },
            {
              "name": "beneficiary",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "integrator_fee_amount_bps",
              "type": "core::integer::u128"
            },
            {
              "name": "integrator_fee_recipient",
              "type": "core::starknet::contract_address::ContractAddress"
            },
            {
              "name": "routes",
              "type": "core::array::Array::<avnu::models::Route>"
            }
          ],
          "outputs": [
            {
              "type": "core::bool"
            }
          ],
          "state_mutability": "external"
        }
]