# Policy-as-Code-Engine-for-Academic-Compliance 
*A Local RAG System for Clause-Level Regulatory Interpretation*

---

## 📌 Overview

This project builds a **local Retrieval-Augmented Generation (RAG)**–based engine to help academic institutions interpret regulations from **UGC**, **AICTE**, and internal policy documents.  
Admins can ask **natural-language questions**, and the system returns:

- **Grounded answers** based strictly on retrieved clauses  
- **Citations** indicating the exact policy source  
- **Top-k retrieved text segments** with similarity distances  
- **Precedence-aware reasoning** using a Policy-as-Code layer  

The entire system is designed to run **offline**, ensuring privacy, security, and reliability.

---

## 🎯 Problem Statement

Academic regulations are scattered across multiple authorities and formats (PDFs, scans, circulars). Institutions struggle to:

- Locate relevant clauses quickly  
- Interpret conflicting guidelines  
- Provide citation-backed decisions  
- Maintain consistent compliance  

This project solves these gaps by creating a **centralized, searchable, clause-level compliance engine**.

---

## 🏗️ System Architecture

### **1. Offline Ingestion Pipeline**
- PDF collection from UGC, AICTE, institutional sources  
- OCR for scanned PDFs  
- Text cleaning (header/footer removal, noise filtering)  
- Clause segmentation into small sections  
- Metadata tagging:
  - issuing body  
  - year  
  - category (admissions, exams, PhD, anti-ragging, etc.)  
- Embedding using **`nomic-embed-text`**  
- Stored in **ChromaDB** (`policy_docs` collection)

### **2. Online Query Engine**
User question → embedding → top-k retrieval → prompt construction → LLM answer (Qwen 2.5 3B Instruct)


Ensures **trustworthy, deterministic compliance reasoning**.

---

## 💡 Features

-  **Semantic clause-level search**  
- **RAG with local LLM (Qwen 2.5 3B via Ollama)**  
- **Multi-source knowledge base (PDFs → OCR → embeddings)**  
- **Citations and source distances**  
- **Fully local, offline system**  
- **Anti-hallucination prompting**  
- **Clean ingestion pipeline for policy documents**

---

## 🖥️ Tech Stack

| Component | Tool/Model |
|----------|------------|
| LLM | Qwen 2.5 3B Instruct (Ollama) |
| Embeddings | nomic-embed-text |
| Vector Store | ChromaDB |
| OCR |  pytesseract |
| Backend Notebooks | Python, Jupyter |
| Storage | Local |

---

## 📂 Repository Structure
```
Policy-as-Code-Engine-for-Academic-Compliance/
│
├── Chroma_db_database/
│
├── Data/
│    ├── CleanedText/
|    ├── Review/
|
├── Diagrams/
│
├── Major Research Paper Analysis (Abhinav)/
│
├── Notebooks/
│   ├── Data Ingestion/
│   │   ├── Notebooks of Data ingestion
│   ├── Experimental_Testing/
│   │   ├── experiment_results/
│   │   ├── Comparison_7b_vs_3b notebook/
│   │   ├── Prompt Engineering notebook/
│   │   └── Top-k notebok/
│   ├── LLM_Integration notebook/
|
│── RAG_Virtual_env/
│
├── Testing_notebooks/
│
├── Video_Demonstration/
│
├── Workflow
│
├── requirements.txt
|
├── README.md
|
└── .gitignore

```

---

## 🚀 Running the System

### **Prerequisites**
- Python 3.13.4
- Ollama installed  
- Qwen model pulled:
  ```
  ollama pull qwen2.5:3b-instruct
  ```
Install Dependencies
```
pip install requirements.txt
```


## Experiments & Results
* Experiment 1 – Model Comparison
Compared Qwen 2.5 3B vs 7B →
**Qwen 3B** performed better in accuracy, speed, and efficiency.

* Experiment 2 – Top-K Retrieval
Top-k values tested: 1, 3, 5
→ **k = 3** gave best quality/noise balance.

* Experiment 3 – Prompt Engineering
Evaluated 8 prompt types
→ **Chain of thought** Prompt achieved optimal results.


## Future Enhancements
* Web UI

* Fine-grained clause classification using LLMs

* Improved evaluation framework

* GPU-optimized local inference

