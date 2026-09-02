# ROADMAP BELAJAR AI ENGINEER DARI NOL
### Disusun untuk: Ahmat Setiadi (Mahasiswa Teknik Informatika, Peminatan Sistem Cerdas, Semester 7 — UPI YPTK Padang)
### Revisi 2: disesuaikan dengan kurikulum kuliah & tren industri AI Engineer 2026

**Catatan revisi:** Versi ini merevisi roadmap sebelumnya berdasarkan dua hal — (1) kurikulum resmi Peminatan Sistem Cerdas Anda, agar tidak ada materi yang diulang dari nol padahal sudah pernah dipelajari di kelas, dan (2) pergeseran definisi "AI Engineer" di industri 2026 yang jauh lebih menekankan LLM application development (RAG, agent, vector database) dibanding training model dari nol. Matematika tetap tidak disertakan karena sudah dikuasai dari perkuliahan.

---

## PEMETAAN KURIKULUM KE ROADMAP

Ini penting agar Anda tidak belajar ulang dari nol untuk hal yang sudah pernah didapat di kelas — tapi tetap sadar bagian mana yang **belum pernah** diajarkan secara formal.

| Mata Kuliah (Kurikulum) | Semester | Terkait Stage | Dampak ke Roadmap |
|---|---|---|---|
| Pengantar Kecerdasan Buatan | I | Stage 1 | Sudah dapat — Stage 1 jadi **review cepat**, bukan dari nol |
| Kecerdasan Buatan Lanjut | II | Stage 1 | Sudah dapat — idem |
| Pemrograman Data Analysis | IV | Stage 3 | Kemungkinan sudah kenal dasar Python untuk data — Stage 3 bisa dipercepat |
| Probabilitas dan Statistika | IV | Mendukung Stage 4 | Sudah dikuasai — bantu pemahaman evaluasi model |
| Aljabar Linier dan Matriks | V | Mendukung Stage 5 | Sudah dikuasai — bantu pemahaman operasi tensor |
| Sistem Pengambilan Keputusan | V | Sedikit menyentuh Stage 4 | Konsep decision support, bukan ML murni — tetap perlu Stage 4 penuh |
| Knowledge Based System (Peminatan 1) | VI | Di luar cakupan roadmap | AI simbolik berbasis rule/logic — wawasan tambahan, relevansi industri modern rendah |
| Fuzzy Logic Programming (Peminatan 2) | V | Di luar cakupan roadmap | Soft computing klasik — wawasan tambahan, relevansi industri modern rendah |
| Digital Image Processing (Peminatan 3) | VI | Stage 6 | Sudah dapat + sudah praktik (proyek MATLAB GUIDE Anda) — Stage 6 dipercepat |
| Artificial Neural Network (Peminatan 4) | VI | Stage 5 | Sudah dapat teori NN — Stage 5 fokus ke **implementasi framework**, bukan teori ulang |
| Natural Language Processing (Peminatan 5) | VI | Stage 7 | Sudah dapat teori dasar NLP — Stage 7 fokus ke representasi **modern** (embedding, transformer) |

**Gap penting yang perlu Anda sadari:** mata kuliah **Machine Learning** (klasik, scikit-learn style: regresi, decision tree, SVM, evaluasi model, dsb) ada di **Peminatan Data Sains**, bukan di Peminatan Sistem Cerdas yang Anda ambil. Artinya besar kemungkinan Anda **belum pernah** mendapat ML klasik secara formal di kelas. Ini menjadikan **Stage 4 di roadmap justru gap paling krusial**, bukan sekadar pelengkap — jangan diskip meski terasa "dasar".

---

## RINGKASAN TAHAPAN (SUDAH DIREVISI)

| Stage | Nama Stage | Status vs Kurikulum | Estimasi Jam |
|---|---|---|---|
| 1 | Fondasi Konsep AI, ML & Deep Learning | Sebagian besar **sudah dapat di kuliah** → review | 8 jam |
| 2 | Python untuk AI/ML | Baru (skill teknis, bukan diajarkan formal) | 35 jam |
| 3 | Data Handling, Analysis & Visualisasi | Sebagian sudah dapat (Pemrog. Data Analysis) → dipercepat | 20 jam |
| 4 | Machine Learning Klasik | **Gap kurikulum — prioritas tinggi, penuh** | 45 jam |
| 5 | Deep Learning Fundamentals | Teori sudah dapat (ANN) → fokus praktik framework | 35 jam |
| 6 | Computer Vision & CNN Lanjutan | Sudah kuat (DIP + skripsi) → dipercepat | 25 jam |
| 7 | NLP & Representasi Teks Modern | Teori dasar sudah dapat → fokus modern (embedding, transformer) | 25 jam |
| 8 | **LLM Engineering, RAG & Agentic AI** *(stage baru)* | Baru — ini standar wajib AI Engineer 2026 | 35 jam |
| 9 | MLOps & Deployment | Baru (skill industri, bukan diajarkan formal) | 35 jam |
| 10 | Portofolio, Sertifikasi & Karier | Baru | 30 jam |
| | **TOTAL** | | **≈ 293 jam** |

Total berkurang dari estimasi awal (320 → 293 jam) karena beberapa stage dipercepat berkat kurikulum, meski ada tambahan stage baru (LLM/RAG/Agent) untuk relevansi 2026. Dengan 10–12 jam/minggu, ini bisa selesai **± 6–7 bulan**.

---

## STAGE 1 — Fondasi Konsep AI, Machine Learning & Deep Learning *(Mode Review)*
**Tujuan Stage:** Menyegarkan kembali konsep dari mata kuliah Pengantar KB dan KB Lanjut, memastikan istilah-istilah dasar benar-benar melekat sebelum masuk ke praktik.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Review Peta AI-ML-DL | Refresh hubungan AI, ML, DL dan jenis-jenis learning | 1 jam | Sedang | Sudah pernah dapat di Pengantar KB & KB Lanjut |
| Review Konsep Dataset & Model | Istilah dataset, fitur, label, training/testing, loss, inference | 1 jam | Sedang | Review cepat |
| Review Overfitting & Bias-Variance | Pastikan konsep ini benar-benar kuat, sering jadi dasar debugging | 2 jam | Tinggi | Ini sering dilupakan meski sudah pernah diajarkan |
| Update Wawasan: Etika & Batasan AI | Bias, privasi data, explainability — termasuk isu AI 2026 (regulasi, LLM misuse) | 2 jam | Rendah | Bagian yang mungkin belum dibahas mendalam di kelas |
| Ekosistem Karier AI Terkini | Perbedaan AI Engineer vs ML Engineer vs Data Scientist di pasar 2026 | 2 jam | Sedang | Definisi "AI Engineer" bergeser ke arah LLM app development |

---

## STAGE 2 — Python untuk AI/ML
**Tujuan Stage:** Menguasai Python sebagai bahasa utama AI/ML dengan pola-pola yang sering dipakai di data science, di luar apa yang biasanya diajarkan sebagai bahasa pemrograman umum di kelas Algoritma/OOP.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Setup Environment | Instalasi Python, virtual environment, Jupyter Notebook, VS Code | 3 jam | Tinggi | Anda sudah pernah pakai Flask — bagian ini cepat |
| Struktur Data Python untuk Data Science | List, dict, set beserta method yang sering dipakai di ML | 3 jam | Tinggi | Fokus ke pola pakai di Pandas/NumPy, bukan teori struktur data |
| Fungsi, Lambda & Comprehension | Function, lambda, list/dict comprehension | 3 jam | Sedang | Lambda sering dipakai di Pandas |
| OOP untuk Memahami API Library | Class, inheritance — cukup untuk membaca API sklearn/PyTorch | 3 jam | Sedang | Anda sudah punya dasar OOP dari mata kuliah PBO |
| File Handling & Exception | CSV, JSON, try-except untuk load dataset | 2 jam | Sedang | |
| Package Management | pip, requirements.txt, environment yang reproducible | 2 jam | Tinggi | Penting agar proyek AI rapi |
| Studi Kasus Mini Project | Program CLI kecil untuk latihan statistik/data sederhana | 4 jam | Sedang | Latihan gabungan |

---

## STAGE 3 — Data Handling, Analysis & Visualisasi *(Dipercepat)*
**Tujuan Stage:** Mahir mengolah data dengan NumPy/Pandas — 70% pekerjaan AI Engineer sehari-hari. Karena Anda sudah dapat mata kuliah Pemrograman Data Analysis, sebagian dasar mungkin sudah familiar.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| NumPy Fundamental | Array, indexing, broadcasting | 3 jam | Tinggi | Percepat jika sudah familiar dari Pemrog. Data Analysis |
| Pandas Fundamental & Cleaning | DataFrame, missing value, duplikat | 4 jam | Tinggi | |
| Data Transformation | Groupby, merge, pivot, apply | 3 jam | Sedang | |
| Exploratory Data Analysis (EDA) | Statistik deskriptif, distribusi, korelasi | 3 jam | Tinggi | Manfaatkan dasar Probabilitas & Statistika Anda |
| Visualisasi Matplotlib & Seaborn | Chart dasar hingga heatmap korelasi | 3 jam | Sedang | |
| Feature Engineering Dasar | Encoding, scaling, binning | 2 jam | Tinggi | Langsung berdampak ke Stage 4 |
| Studi Kasus Mini Project | EDA lengkap pada dataset publik | 2 jam | Sedang | |

---

## STAGE 4 — Machine Learning Klasik *(GAP KURIKULUM — Prioritas Tinggi)*
**Tujuan Stage:** Ini bagian yang **tidak** Anda dapat secara formal karena berada di Peminatan Data Sains. Pelajari penuh, jangan dipercepat.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Alur Kerja ML (ML Workflow) | Data → preprocessing → training → evaluasi → tuning | 2 jam | Tinggi | Kerangka besar yang dipakai berulang |
| Regresi Linear & Logistik | Konsep + implementasi scikit-learn | 5 jam | Tinggi | |
| Decision Tree & Random Forest | Konsep, implementasi, interpretasi | 5 jam | Tinggi | |
| KNN & SVM | Konsep dan implementasi | 4 jam | Sedang | SVM sudah pernah disentuh sedikit di proyek NLP Anda |
| Naive Bayes | Konsep dan implementasi | 2 jam | Rendah | Sudah pernah dipakai di proyek NLP Anda |
| Ensemble Methods | Bagging, Boosting, XGBoost/LightGBM pengantar | 4 jam | Sedang | |
| Unsupervised Learning | K-Means, hierarchical clustering, PCA | 5 jam | Sedang | |
| Evaluasi Model | Accuracy, precision, recall, F1, ROC-AUC, confusion matrix | 4 jam | Tinggi | Wajib kuasai — sering ditanya saat interview |
| Cross Validation & Hyperparameter Tuning | K-fold CV, GridSearchCV | 4 jam | Tinggi | |
| Pipeline scikit-learn | Preprocessing + model dalam satu pipeline | 3 jam | Sedang | |
| Studi Kasus Mini Project | End-to-end ML pipeline pada dataset tabular | 7 jam | Tinggi | Proyek pembuktian Stage 4 |

---

## STAGE 5 — Deep Learning Fundamentals *(Fokus Praktik, Teori Sudah Dapat)*
**Tujuan Stage:** Anda sudah dapat teori neural network dari mata kuliah Artificial Neural Network. Stage ini fokus ke **implementasi framework nyata**, bukan mengulang teori.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Review Cepat Teori ANN | Neuron, forward/backprop, activation function | 2 jam | Sedang | Review, sudah dapat di kelas ANN |
| Pengenalan TensorFlow/Keras | Sequential model, compile, fit | 5 jam | Tinggi | Anda sudah punya modal dari skripsi (MobileNetV2) |
| Pengenalan PyTorch | Tensor, autograd, model dasar | 5 jam | Sedang | Banyak dipakai riset & LLM modern |
| Optimizer & Loss Function Praktik | Implementasi SGD, Adam, berbagai loss function | 3 jam | Sedang | |
| Regularisasi Praktik | Dropout, L1/L2, Batch Normalization | 3 jam | Sedang | |
| Multilayer Perceptron (MLP) | Bangun MLP dari nol untuk klasifikasi | 5 jam | Tinggi | Latihan inti sebelum CNN |
| Callback & Training Best Practice | Early stopping, checkpoint, LR scheduler | 3 jam | Sedang | |
| Transfer Learning (Konsep + Praktik) | Kenapa & kapan pakai model pre-trained | 3 jam | Tinggi | Langsung relevan ke pengalaman skripsi |
| Studi Kasus Mini Project | Latih MLP pada dataset gambar sederhana (MNIST) | 6 jam | Tinggi | |

---

## STAGE 6 — Computer Vision & CNN Lanjutan *(Dipercepat — Modal Kuat dari DIP & Skripsi)*
**Tujuan Stage:** Anda sudah dapat Digital Image Processing dan sudah praktik langsung (proyek MATLAB GUIDE + skripsi CNN/MobileNetV2). Stage ini memperdalam sisi arsitektur modern.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Review Anatomi CNN | Convolution, pooling, stride, padding | 2 jam | Sedang | Sudah pernah dipraktikkan langsung di skripsi |
| Image Preprocessing & Augmentation | Resize, normalisasi, augmentasi | 2 jam | Rendah | Kemungkinan sudah diterapkan di skripsi |
| Arsitektur CNN Modern | ResNet, Inception, EfficientNet, MobileNet mendalam | 5 jam | Tinggi | Perdalam MobileNetV2 + bandingkan arsitektur lain |
| Transfer Learning Praktik Lanjutan | Fine-tuning pada dataset custom baru (di luar topik skripsi) | 5 jam | Tinggi | Perluas portofolio di luar topik katarak |
| Object Detection & Segmentation (Pengantar) | Konsep YOLO, U-Net untuk medical imaging | 4 jam | Rendah | Relevan dengan minat medical imaging Anda |
| Deployment Model CV via API | Serving model CNN lewat Flask (relevan skripsi) | 4 jam | Tinggi | Langsung applicable ke sistem skripsi Anda |
| Studi Kasus Mini Project | Klasifikasi gambar dengan arsitektur berbeda dari skripsi | 3 jam | Sedang | |

---

## STAGE 7 — NLP & Representasi Teks Modern *(Fokus ke Materi Pasca-Kelas NLP)*
**Tujuan Stage:** Anda sudah dapat teori dasar NLP di kelas. Stage ini lompat ke representasi teks modern yang biasanya tidak dibahas mendalam di kurikulum kampus.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Review Cepat Text Preprocessing | Tokenization, stemming, TF-IDF | 1 jam | Rendah | Sudah dikuasai — Anda bahkan sudah pakai di proyek NLP |
| Word Embedding | Word2Vec, GloVe — representasi kata sebagai vektor | 4 jam | Tinggi | Kemungkinan besar belum dibahas mendalam di kelas NLP kampus |
| RNN/LSTM (Konsep Singkat) | Data sekuensial, konteks historis sebelum Transformer | 2 jam | Rendah | Cukup pengantar, banyak digantikan Transformer |
| Arsitektur Transformer | Self-attention, multi-head attention | 5 jam | Tinggi | Fondasi wajib semua LLM modern — kemungkinan besar gap kurikulum |
| Pre-trained Model NLP | BERT, GPT — konsep dan perbedaan use-case | 4 jam | Tinggi | |
| Fine-tuning Model NLP | Fine-tuning BERT untuk klasifikasi teks | 5 jam | Sedang | Praktik dengan Hugging Face |
| Pengenalan Hugging Face Ecosystem | Transformers library, model hub, pipeline API | 4 jam | Sedang | Tools standar industri |
| Studi Kasus Mini Project | Klasifikasi teks dengan model pre-trained modern | 4 jam | Sedang | Upgrade dari proyek TF-IDF Anda sebelumnya |

---

## STAGE 8 — LLM Engineering, RAG & Agentic AI *(Stage Baru — Wajib untuk Standar 2026)*
**Tujuan Stage:** Ini yang paling membedakan roadmap versi lama dengan definisi AI Engineer saat ini. Bahkan posisi entry-level di 2026 diharapkan paham RAG, embeddings, vector database, dan agentic workflow — bukan lagi opsional.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Cara Kerja LLM & LLM API | Memahami LLM sebagai black box yang dipanggil via API (bukan dilatih sendiri) | 3 jam | Tinggi | Ini inti pekerjaan AI Engineer modern |
| Prompt Engineering | Teknik prompting: zero-shot, few-shot, chain-of-thought | 4 jam | Tinggi | Skill dasar wajib |
| Structured Output & Function Calling | Membuat LLM mengembalikan output terstruktur (JSON), tool calling | 4 jam | Tinggi | Dipakai luas di aplikasi produksi |
| Embeddings & Vector Database | Konsep embedding, similarity search, pengenalan vector DB (misal Chroma/FAISS) | 5 jam | Tinggi | Fondasi RAG |
| Retrieval-Augmented Generation (RAG) | Membangun sistem RAG sederhana: dokumen → embedding → retrieval → jawaban | 6 jam | Tinggi | Skill paling dicari saat ini untuk role AI Engineer |
| Agentic Workflow & Tool Use | Konsep AI agent, multi-step reasoning, tool use | 5 jam | Sedang | Berkembang cepat, mulai jadi standar |
| Pengenalan Model Context Protocol (MCP) | Konsep MCP untuk menghubungkan LLM ke tools/data eksternal | 3 jam | Sedang | Standar baru yang mulai banyak diadopsi industri |
| Studi Kasus Mini Project | Bangun aplikasi RAG sederhana (misal: chatbot tanya-jawab dari dokumen skripsi Anda sendiri) | 5 jam | Tinggi | Proyek portofolio yang sangat relevan untuk lamaran kerja |

---

## STAGE 9 — MLOps & Model Deployment
**Tujuan Stage:** Membawa model/sistem AI dari notebook ke production — pembeda utama "bisa bikin model" dengan "AI Engineer" sesungguhnya.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Model Serialization | Pickle, joblib, SavedModel, ONNX | 2 jam | Tinggi | |
| Membangun REST API untuk Model | Flask/FastAPI untuk serving model ML/DL/LLM | 5 jam | Tinggi | Anda sudah berpengalaman Flask |
| Containerization dengan Docker | Dockerize aplikasi AI agar portable | 5 jam | Tinggi | Skill wajib di hampir semua lowongan |
| Dasar Cloud untuk AI | Pengantar AWS/GCP/Azure untuk hosting model | 5 jam | Sedang | Pilih satu ekosistem, dalami |
| Monitoring Model di Production | Model drift, logging prediksi, retraining trigger | 3 jam | Sedang | |
| Optimasi Model untuk Inference | Quantization, pruning — relevan untuk MobileNet/edge | 3 jam | Sedang | Relevan dengan pengalaman MobileNetV2 skripsi |
| CI/CD Dasar untuk AI | Konsep otomasi testing & deployment | 2 jam | Rendah | Cukup konsep di awal |
| Studi Kasus Mini Project | Deploy 1 model (boleh dari skripsi atau Stage 8) sebagai API ter-Docker-kan | 5 jam | Tinggi | Proyek pembuktian dari model ke sistem yang bisa diakses |

---

## STAGE 10 — Portofolio, Sertifikasi & Persiapan Karier
**Tujuan Stage:** Mengemas seluruh pembelajaran menjadi portofolio nyata dan siap melamar sebagai AI Engineer.

| Task | Deskripsi | Estimasi Jam | Prioritas | Catatan |
|---|---|---|---|---|
| Kurasi Portofolio GitHub | Rapikan 3–5 proyek terbaik (termasuk skripsi & proyek RAG Stage 8) | 5 jam | Tinggi | |
| Bangun Personal Project End-to-End | 1 proyek AI baru dari ide sendiri, idealnya berbasis LLM/RAG | 8 jam | Tinggi | Proyek yang mencerminkan skill 2026 (bukan cuma CNN klasik) |
| Ikut Kompetisi Kaggle/DrivenData | Minimal 1 kompetisi untuk pengalaman & benchmarking | 4 jam | Sedang | |
| Sertifikasi Relevan | TensorFlow Developer, cloud AI associate, atau sertifikasi LLM/RAG | 4 jam | Rendah | Opsional, menambah kredibilitas CV |
| Menulis CV & LinkedIn untuk AI Engineer | Highlight skripsi + proyek RAG/agent sebagai bukti skill 2026 | 3 jam | Tinggi | |
| Latihan Technical Interview | Soal ML/DL konsep, coding Python, studi kasus | 4 jam | Tinggi | |
| Latihan System Design AI | Latihan menjawab "bagaimana Anda mendesain sistem RAG/AI untuk X" | 2 jam | Sedang | Semakin sering ditanyakan di interview 2026 |

---

## CATATAN PENUTUP

1. **Stage 1, 5, 6, 7 dipercepat** karena tumpang tindih dengan kurikulum Peminatan Sistem Cerdas Anda (Pengantar/Lanjut KB, ANN, DIP, NLP) — manfaatkan waktu yang tersisa untuk memperdalam **Stage 4 (ML Klasik)** yang merupakan gap kurikulum sesungguhnya, dan **Stage 8 (LLM/RAG/Agent)** yang menjadi standar industri 2026.
2. Mata kuliah **Knowledge Based System** dan **Fuzzy Logic Programming** memang tidak masuk roadmap ini secara eksplisit — keduanya tetap bernilai akademis (dan mendukung skripsi/wawasan AI simbolik), tapi relevansinya terhadap peran AI Engineer industri modern relatif rendah dibanding ML/DL/LLM.
3. Proyek RAG di Stage 8 sengaja diarahkan memakai dokumen skripsi Anda sendiri — sekaligus jadi portofolio yang menunjukkan Anda bisa menggabungkan domain expertise (medical imaging) dengan skill LLM terkini.
4. Jika waktu terbatas karena skripsi berjalan paralel, urutan prioritas realistis: **Stage 4 → Stage 8 → Stage 9**, karena tiga ini yang paling menutup gap kurikulum sekaligus paling dicari pasar kerja 2026.
