| Metric        | Qwen 2.5:3B | Qwen 2.5:7B | Winner              |
| ------------- | ----------- | ----------- | ------------------- |
| Avg Latency   | 6.96s       | 43.71s      | 3B (6.3x faster)    |
| Quality Score | 0.292       | 0.263       | 3B (+11%)           |
| Coverage      | 0.249       | 0.223       | 3B (+12%)           |
| Tokens/sec    | 43.9        | 4.7         | 3B (9.4x faster)    |
| Queries/hour  | 517         | 82          | 3B (6.3x more)      |
| CPU Usage     | 23.1%       | 15.9%       | 7B (-31%)           |
| Memory        | 179 MB      | 160 MB      | 7B (-11%)           |


why the 3B model OUTPERFORMS the 7B model! This is counterintuitive because larger models typically have better reasoning ?

Possible Explanations:

* Instruction-tuning difference: 3B is "instruct" variant, optimized for following prompts
* Context window handling: 7B struggles with large contexts (K=3 = 193K chars)
* Evaluation bias: Metric favors keyword coverage over semantic understanding
* Verbosity difference: 3B generates more words (99.6 vs 76.7), capturing more keywords
* Quantization effects: 7B may lose more capability when compressed

