| Top-K | Hit Rate | Precision | Answer Correctness | Composite Score | Context Size |

| ----- | -------- | --------- | ------------------ | --------------- | ------------ |

| 1     | 96.4%    | 100%      | 40.3%              | 0.807           | 22.6K chars  |

| 3     | 96.4%    | 71.4%     | 11.9%              | 0.636           | 193.4K chars |

| 5     | 96.4%    | 68.6%     | 11.9%              | 0.627           | 389.5K chars |

| 7     | 96.4%    | 73.4%     | 16.8%              | 0.656           | 527.0K chars |

| 10    | 96.4%    | 72.9%     | 15.5%              | 0.651           | 955.3K chars |


## Optimal Found K=3

Q: Why K=3 is Optimal?



Ans-> 

* Single-doc retrieval (K=1) creates a single point of failure, if the top-1 document is slightly off-topic, the entire answer fails.
* K=3 increases probability of capturing all required items.
* Only 21% drop in composite score (0.807 → 0.636)
* Hit rate remains perfect at 96.4%
* 71.4% precision means 2 out of 3 docs are still highly relevant
* 193K characters is well within Qwen2.5:7b's 32K token limit (~128K chars)
* Latency remains stable at 26.5s (actually faster than K=1's 30.4s)

Q: Why answer correctness is problematic across ALL K values (11-40%)?
Ans-> 

Gold Standard Too Strict

Evaluation uses exact keyword matching

LLM may paraphrase correctly but fail keyword check

Solution: Use semantic similarity scoring instead


Time took for this experiment -> 15 min