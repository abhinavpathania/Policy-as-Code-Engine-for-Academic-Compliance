## Graph 1: Average Latency (Top Left)

**What It Shows**

- Blue bar (3B): ~7 seconds  
- Red bar (7B): ~43 seconds  

**Interpretation**

- **Winner:** 3B model (≈6.3× faster)  
- The 3B model responds in just ~7 seconds on average.  
- The 7B model takes ~43 seconds, over six times slower.  
- In production, users typically expect responses within 5–10 seconds, so 43-second latency is unacceptable for real-time applications.  
- Despite having fewer parameters, the 3B model’s smaller size allows much faster inference.  

**Business Impact**

- 3B can handle roughly 6× more users with the same infrastructure.  
- Better user experience due to shorter wait times.  

---

## Graph 2: Answer Quality Score (Top Middle)

**What It Shows**

- Blue bar (3B): ~0.29 (29%)  
- Red bar (7B): ~0.26 (26%)  

**Interpretation**

- **Winner:** 3B model (≈11% better).  
- The quality score measures how well the answer matches expected content (key terms, relevance, completeness).  
- 3B achieves about 29.2% quality vs 7B’s 26.3%.  
- This is counterintuitive because the smaller model performs better.  

**Why 3B Wins Despite Being Smaller**

- Instruction‑tuned: 3B is an “instruct” variant, better at following prompts.  
- More verbose: 3B generates ~100 words vs 7B’s ~77 words, capturing more key terms.  
- Better context handling: 3B may handle the ~193K‑character context more effectively.  

**Critical Note**

- Both scores are low (under 30%), which suggests:  
  - The evaluation metric may be too strict.  
  - The models struggle with comprehensive multi‑part answers.  
  - Prompts need further optimization.  

---

## Graph 3: Generation Speed (Top Right)

**What It Shows**

- Blue bar (3B): ~44 tokens/second.  
- Red bar (7B): ~5 tokens/second.  

**Interpretation**

- **Winner:** 3B model (≈9.4× faster).  
- 3B generates ~44 tokens per second, while 7B generates only ~5 tokens per second.  
- This is a massive difference; 3B is nearly 10× faster at text generation.  

**Why This Matters**

- Throughput: 3B can serve about 9× more concurrent users.  
- Scalability: One 3B instance can match the capacity of roughly nine 7B instances.  
- Cost: This leads to dramatically lower infrastructure costs with 3B.  

**Technical Insight**

- Tokens per second is a core performance metric for language models.  
- It measures raw generation speed, independent of answer length.  
- 3B’s lighter weight enables much faster matrix operations.  

---

## Graph 4: Key Term Coverage (Bottom Left)

**What It Shows**

- Blue bar (3B): ~0.25 (25%).  
- Red bar (7B): ~0.22 (22%).  

**Interpretation**

- **Winner:** 3B model (slightly better).  
- Coverage measures what percentage of expected key terms appear in the answer.  
- 3B captures about 25% of key terms; 7B captures about 22%.  

**Critical Issue**

- Both scores are very low (under 25%), meaning the models miss about 75% of important terms from the gold standard.  
- They may:  
  - Paraphrase instead of using exact terms.  
  - Miss information entirely.  
  - Fail to extract all required items from the context.  

**Solutions Needed**

- Improve prompts, for example: “List **all** objectives mentioned.”  
- Use semantic similarity instead of exact keyword matching for evaluation.  
- Post‑process answers to extract structured information.  

---

## Graph 5: Quality by Complexity (Bottom Middle)

**What It Shows**

A grouped bar chart with three complexity levels:

- **High complexity (blue bars):** 3B = 0.30, 7B = 0.14.  
- **Low complexity (orange bars):** 3B = 0.22, 7B = 0.29.  
- **Medium complexity (green bars):** 3B = 0.34, 7B = 0.36.  

**Interpretation**

- **Low complexity questions:** 7B wins (0.29 vs 0.22), e.g., simple factual questions such as “How many credits?”, where 7B’s deeper reasoning helps.  
- **Medium complexity questions:** 7B slightly wins (0.36 vs 0.34); both models perform similarly.  
- **High complexity questions:** 3B dominates (0.30 vs 0.14).  
  - These are multi‑part questions such as “List three objectives **and** explain…”.  
  - 7B performs very poorly here (~14% quality).  
  - 3B is roughly 2× better on complex queries.  

**Critical Insight**

- For complex academic compliance queries (multi‑part, enumerations, cross‑references), the 3B model is clearly superior, even though it is smaller.  

**Why 7B Fails on High Complexity**

- The large context (~193K characters) can overwhelm its attention mechanism.  
- The model may get “lost” in long contexts.  
- It may over‑abstract instead of listing concrete items.  

---

## Graph 6: CPU Usage (Bottom Right)

**What It Shows**

- Blue bar (3B): ~23% CPU usage.  
- Light blue bar (7B): ~16% CPU usage.  

**Interpretation**

- **Winner on raw CPU usage:** 7B model (≈31% more CPU‑efficient per query).  
- 7B uses about 16% CPU vs 3B’s 23% CPU.  
- 7B is more resource‑efficient **per single query**, but this is misleading when throughput is considered.  

**Why 3B Is Still Better Overall**

Despite higher CPU usage per query, 3B is more cost‑effective because of throughput:

- **Throughput analysis:**  
  - 3B: ~517 queries/hour at 23% CPU.  
  - 7B: ~82 queries/hour at 16% CPU.  

- **To handle 500 queries/hour:**  
  - 3B: 1 instance × 23% CPU ≈ 23% total CPU.  
  - 7B: 6.1 instances × 16% CPU = 97.6% total CPU


Conclusion: 3B uses 45% more CPU per query, but delivers 6.3x more queries per instance, making it 4x more cost-effective overall.
