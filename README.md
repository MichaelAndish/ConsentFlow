# ConsentFlow — BSPHO ICF Workbench

> 🏆 **Built in 4 Hours at "Hacking for Good 2026" (Google Belgium)**  
> This project was conceptualized, architected, and engineered in just **4 hours** during the **Hacking for Good** hackathon organized by **Google Cloud, Google Research, and Google Belgium** on **29th October 2026** in Ghent, Belgium, in close partnership with the **Belgian Society of Paediatric Haematology and Oncology (BSPHO)**.  
> 
> 🔒 **Sample & Demo Data Notice:**  
> All clinical trial protocols, patient age cohorts, document blocks, investigator names, hospital contacts, and insurance policy certificates presented in this repository and application are strictly **sample, synthetic, and demonstration mock data**. **No critical, confidential, or protected patient health information (PHI)** exists in this project.  
> See [SECURITY.md](./SECURITY.md) for secret-handling rules (Gemini keys stay server-side; `.env` is never committed).

---

## About the Hackathon: "Hacking for Good 2026"

**Hacking for Good 2026** is a collaborative technology initiative organized by **Google** (Google Cloud, Google Research, and Google Belgium) uniting cross-functional software engineers, AI researchers, and healthcare innovators to build impactful, production-ready solutions for non-profit medical organizations.

In this edition, Google partnered directly with the **Belgian Society of Paediatric Haematology and Oncology (BSPHO)** — the umbrella non-profit consortium coordinating clinical research across all **7 university paediatric haemato-oncology centers** in Belgium:
1. **UZ Gent** (Ghent)
2. **HUDERF** (Hôpital Universitaire Des Enfants Reine Fabiola, Brussels)
3. **UZ Leuven** (Leuven)
4. **CHC MontLégia** (Liège)
5. **Cliniques universitaires Saint-Luc** (Brussels)
6. **UZ Antwerpen** (Antwerp)
7. **CHU UCL Namur** (Yvoir)

### The Real-World Challenge
When international sponsors launch a paediatric clinical trial, the Belgian National Coordinating Center (NCC) and BSPHO must turn a massive master protocol into an ethics-compliant submission dossier. Under Belgian law and Good Clinical Practices (GCP), this requires preparing a large bunch of Informed Consent and Assent Forms (ICFs), age-tailored booklets, site riders, and sub-study annexes across diverse patient age cohorts and national languages:

```text
                    ONE clinical trial protocol
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
   Target Age Cohorts                           Official Languages
   ├── Adult (18+ young adults)                 ├── English (Master / PI review)
   ├── Parent / Legal Guardian                  ├── Dutch (NL - Belgian Ethics)
   ├── Adolescent (Assent)                      └── French (FR - Belgian Ethics)
   └── Child (Illustrated assent)
          │                                           │
          └─────────────────────┬─────────────────────┘
                                ▼
                 ┌──────────────────────────┐
                 │  Bunch of Consent Forms, │
                 │  Annexes & Assent Packs  │
                 └──────────────────────────┘
```

Historically, teams had to maintain endless separate Microsoft Word files manually. With complex trials, optional biobank waivers, longitudinal questionnaires, and site-specific contacts, the bunch of contents grows constantly. This creates serious operational vulnerabilities:
- **Fact Drift:** English adult draft says 3 blood draws, but Dutch child booklet still states 4.
- **Legal Compliance Risks:** Mandatory Belgian statutory clauses (e.g., Belgian Law of 7 May 2004, **Article 6** voluntary withdrawal and **Article 29** no-fault clinical trial insurance) cannot be freely rewritten or modified by machine translation.
- **Cognitive Load by Age:** Children require short, reassuring language with illustrations; adolescents require simplified terms without complex liability jargon; parents require comprehensive procedure and risk disclosures.

### Collaborative Stakeholder Ecosystem

```mermaid
flowchart LR
    Sponsor["Sponsor<br/>sends protocol"] --> PI["PI / Coordinator<br/>reviews facts"]
    PI --> BSPHO["BSPHO Team<br/>builds ICF package"]
    BSPHO --> EC["Ethics Committee<br/>reviews & approves"]
    EC --> Sites["Hospital Sites<br/>use approved forms"]
    Sites --> Families["Patients & Families<br/>sign age-appropriate forms"]
```

| Stakeholder Role | Primary Operational Responsibility |
| :--- | :--- |
| **Study Sponsor** | Supplies international master protocol, investigator brochure, and clinical trial dossier. |
| **Principal Investigator (PI)** | Verifies clinical accuracy, treatment dosages, procedure schedules, and local protocol markups. |
| **BSPHO National Coordinator** | Orchestrates the multi-cohort ICF matrix, enforces template profiles, and prepares submission files. |
| **Ethics Committee (EC / FAMHP)** | Evaluates patient safety, informed consent clarity, and adherence to Belgian statutory requirements. |
| **7 Hospital Sites** | Adds site-specific investigator contacts, 24/7 on-call emergency numbers, and local insurance riders. |
| **Patients & Families** | Receives transparent, age-appropriate, compassionate forms in their native language (EN, NL, FR). |

**ConsentFlow** was built in 4 hours to solve this challenge through automated extraction, consistency validation, locked legal translation, and modular template management on Google Cloud.

---

## Visual Tour & Screenshots

All interface screenshots below are captured directly from the running ConsentFlow application:

### 1. Multicentric Dashboard & Trial Portfolio Overview
*Comprehensive status of all participating hospital sites, workflow stages, pending coordinator actions, and overall package completion.*
![Dashboard Overview](./public/Demo-1.png)

---

### 2. Multi-Cohort ICF Matrix & Audience Lifecycle
*Real-time matrix tracking all age cohorts across English, Dutch, and French, with granular status indicators (draft, PI review, ethics approved, exported).*
![ICF Document Matrix](./public/Demo-2.png)

---

### 3. Clinical Fact Consistency & Discrepancy Detection
*Automated cross-check engine identifying discrepancies (such as protocol blood sampling vs investigator markup) before ethics submission.*
![Consistency & Discrepancy Engine](./public/Demo-3.png)

---

### 4. Custom Template Studio & Modular Section Exclusions
*Support for non-medical observational studies (e.g. HIRUZ templates) with one-click exclusion of Article 29 Insurance and Contraception clauses.*
![Custom Template Studio](./public/Demo-4.png)

---

### 5. Google Cloud Storage (GCS) Dossier Sync & Multi-Lingual Legal Lock Engine
*Direct synchronization with Google Cloud Storage buckets and side-by-side translation locking mandatory Belgian statutory text.*
![Cloud Storage & Translation Engine](./public/Demo-5.png)

---

## Demo Walkthrough Video

Watch the complete workflow walkthrough demonstrating protocol ingestion, fact conflict resolution, locked translation, and export:

<video src="./public/Demo.mov" controls width="100%" playsinline>
  Your browser does not support the video tag.
</video>

*Video file location:* [`public/Demo.mov`](./public/Demo.mov)

---

## Visual Technical Architecture & Data Flow

ConsentFlow is architected as an enterprise-grade cloud native application running on Google Cloud with regional defaults centered in Belgium (`europe-west1`):

```mermaid
flowchart TB
    subgraph Client["Client Presentation Tier (Browser)"]
        UI["React 19 + TypeScript SPA"]
        Tailwind["Tailwind CSS + Lucide Icons"]
        MatrixView["Multi-Cohort ICF Matrix View"]
        FactInspector["Clinical Fact & Discrepancy UI"]
    end

    subgraph GCP["Google Cloud Platform (Region: europe-west1)"]
        subgraph Compute["Serverless Compute Tier (Cloud Run)"]
            Express["Node.js 22 Express Engine (Port 8080)"]
            APIRouter["REST API Router (/api/studies, /api/seed, /api/health)"]
            LockEngine["Statutory Legal Lock Engine (Belgian Law Art. 6 & 29)"]
            ConflictDetector["Cross-Document Consistency Checker"]
        end

        subgraph GenAI["Generative AI & LLM Tier"]
            Gemini["Google Gemini 3.8 Flash API"]
            AssentGenerator["Paediatric Language Simplification"]
            LegalTranslator["Mixed Legal / Clinical Translation"]
        end

        subgraph Storage["Persistence & Document Assets"]
            GCS["Google Cloud Storage (GCS)<br/>gs://use-cases-qwiklabs-gcp-01-d64f5abfabdc/"]
            CloudSQL["Cloud SQL for PostgreSQL 16<br/>(Studies, Sites, Facts, Issues, Matrices)"]
            InMemory["Resilient In-Memory State Fallback"]
        end
    end

    Client -->|HTTPS / REST API| Express
    Express --> APIRouter
    APIRouter --> LockEngine
    APIRouter --> ConflictDetector
    APIRouter --> CloudSQL
    APIRouter -.->|Fail-safe Fallback| InMemory
    ConflictDetector --> Gemini
    LockEngine --> Gemini
    Gemini --> AssentGenerator
    Gemini --> LegalTranslator
    Express -->|GCS Bucket Dossier Sync| GCS
```

### Technical Explanation of System Tiers

#### 1. Client Presentation Tier
- **Modern React 19 SPA:** Built with TypeScript and Vite, delivering an ultra-responsive clinical workbench with zero page reloads.
- **Dynamic Matrix UI:** Real-time visual tracking of the consent package across all target cohorts and national languages.
- **Interactive Discrepancy Inspector:** Allows Principal Investigators and study coordinators to flag, track, and resolve fact contradictions with audit trails.

#### 2. Serverless Compute Tier (Google Cloud Run)
- **Containerized Express Server:** Built on Node.js 22 Alpine, listening on container port `8080` with auto-scaling from 0 to 5 instances in `europe-west1` (Brussels).
- **Statutory Legal Lock Engine:** Inspects ICF document blocks and tags them into 4 policy classifications (`REQUIRED_VERBATIM`, `ADAPTABLE_REQUIRED`, `PLACEHOLDER`, `OPTIONAL`). Guarantees that mandatory Belgian clauses (Belgian Law of 7 May 2004, Articles 6 and 29) remain permanently immutable during translation and AI adaptation.
- **Clinical Consistency Engine:** Cross-references protocol source truth with investigator redlines and site agreements, flagging mismatches (such as 4 vs 3 blood draws) before ethics submission.

#### 3. Generative AI Tier (Google Gemini 3.8 Flash)
- **High-Speed Multimodal AI:** Integrates via `@google/genai` using the latest `gemini-3.8-flash` model.
- **Age-Tailored Assent Generation:** Translates complex pharmacological oncology jargon into age-graded, compassionate language for children (8–11) and adolescents (12–17).
- **Mixed Translation:** Translates adaptable clinical procedures into Dutch and French while substituting pre-approved national statutory text for locked legal clauses.
- **Deterministic Rule Fallbacks:** When running without an API key or offline, the system seamlessly applies deterministic rule-based transformations.

#### 4. Persistence & Cloud Storage Tier
- **Google Cloud SQL for PostgreSQL 16:** Enterprise relational database storing 7 normalized tables (`studies`, `study_sites`, `study_facts`, `consistency_issues`, `icf_documents`, `action_items`, `custom_templates`) with indexed JSONB columns for flexible document matrices.
- **Google Cloud Storage (GCS):** Enterprise document bucket (`gs://use-cases-qwiklabs-gcp-01-d64f5abfabdc/`) storing sponsor protocols, HIRUZ templates, and pediatric dossiers in `europe-west1`.
- **Dual-Layer Architecture:** When `DATABASE_URL` is set, ConsentFlow automatically connects to PostgreSQL and runs idempotent schema migrations. If the external database is offline or unconfigured, it automatically serves a seeded in-memory state layer so the clinical application never crashes or blocks.

---

## Google Cloud Services Architecture

| Google Cloud Service | Role in ConsentFlow |
| :--- | :--- |
| **[Cloud Run](https://cloud.google.com/run)** | Fully managed serverless container runtime hosting the application on port `8080` (auto-scaling 0 to 5 instances in `europe-west1`). |
| **[Gemini 3.8 Flash](https://ai.google.dev/)** | State-of-the-art multimodal AI model powering medical jargon simplification and age-tailored assent drafting. |
| **[Cloud Storage (GCS)](https://cloud.google.com/storage)** | Enterprise document repository storing sponsor protocols, HIRUZ templates, and pediatric dossiers in `europe-west1`. |
| **[Cloud SQL for PostgreSQL](https://cloud.google.com/sql)** | Enterprise relational database hosting 7 normalized tables with JSONB document blocks matching local PostgreSQL 16. |
| **[Cloud Build](https://cloud.google.com/build)** | Automated source-to-container build pipeline for rapid continuous deployment. |
| **[Artifact Registry](https://cloud.google.com/artifact-registry)** | Secure container image registry in `europe-west1`. |

---

## 8-Step Paediatric ICF Workflow

```mermaid
flowchart LR
    S1["1. Input Setup<br/>(GCS Bucket)"] --> S2["2. Fact Extraction<br/>(Protocol parsing)"]
    S2 --> S3["3. Template Select<br/>(BSPHO / HIRUZ)"]
    S3 --> S4["4. Draft Gen<br/>(4 EN Cohorts)"]
    S4 --> S5["5. PI Review<br/>(Investigator markup)"]
    S5 --> S6["6. Consistency<br/>(Conflict check)"]
    S6 --> S7["7. Locked Translation<br/>(NL / FR Legal lock)"]
    S7 --> S8["8. Finalize<br/>(Ethics export)"]
```

1. **Input Setup**: Register sponsor documents (PDF/DOCX) from Google Cloud Storage.
2. **Fact Extraction**: Extract clinical facts (duration, drug dosage, visit frequency, insurance).
3. **Template Selection**: Choose standard Belgian interventional v2.4 or customize (e.g., exclude Article 29 Insurance for observational studies).
4. **Draft Generation**: Generate 4 English master forms tailored for Adult, Parent, Adolescent, and Child.
5. **PI Review**: Record Principal Investigator markups with track-change attribution.
6. **Consistency Check**: Cross-examine all documents against confirmed facts to eliminate discrepancies.
7. **Multi-Lingual Locked Translation**: Generate Dutch (NL) and French (FR) versions where mandatory Belgian legal clauses remain permanently locked.
8. **Finalize & Ethics Export**: Export the complete, synchronized ethics submission package.

---

## Run Locally with Docker Compose

Running locally takes a single command:

```bash
make run
```

### What `make run` does automatically:
1. Prepares `.env` from `.env.example` if not present.
2. Launches Docker Compose services (`postgres:16-alpine` on port `5432` + `consentflow-app` on port `1110`).
3. Waits for PostgreSQL database health checks to pass.
4. Executes the **idempotent database seeder** (`tools/seed_db.sh`), inserting all 3 multicentric paediatric trials, 36 documents, sites, and facts with **zero duplicates**.
5. Makes the application immediately accessible at: **[http://localhost:1110](http://localhost:1110)**.

To stop local containers:
```bash
make compose-down
```

---

## Deploy to Google Cloud Run

To deploy your own instance to Google Cloud Run:

```bash
make live
# or: make auth deploy seed
```

### Multi-Account Safety Guardrail:
To prevent accidental deployments to personal or company accounts, set your designated target account in [`.env`](.env):
```env
GOOGLE_CLOUD_ACCOUNT="your-gcp-account@domain.com"
GOOGLE_CLOUD_PROJECT="qwiklabs-gcp-01-d64f5abfabdc"
GOOGLE_CLOUD_REGION="europe-west1"
```
If `GOOGLE_CLOUD_ACCOUNT` does not match the active `gcloud` account, the deployment script aborts immediately with a safety stop.

---

## Environment Configuration

All environment configuration is managed in [`.env`](.env) (refer to [`.env.example`](.env.example)):

```env
# Gemini API Key (Generate free at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.8-flash"

# Google Cloud Platform (Multi-Account Supported)
GOOGLE_CLOUD_ACCOUNT=""
GOOGLE_CLOUD_PROJECT="qwiklabs-gcp-01-d64f5abfabdc"
GOOGLE_CLOUD_REGION="europe-west1"

# Google Cloud Storage (Brussels, Belgium)
GCS_DEFAULT_BUCKET="use-cases-qwiklabs-gcp-01-d64f5abfabdc"
GCS_BUCKET_URI="gs://use-cases-qwiklabs-gcp-01-d64f5abfabdc/"

# Application Ports & Database
ENV_URL="http://localhost:1110"
PORT=1110
DATABASE_URL="postgresql://consentflow:consentflow_secret@localhost:5432/consentflow_db"
```

---

## Useful Makefile Commands

| Command | Action |
| :--- | :--- |
| **`make run`** | **Start local Docker stack (PostgreSQL + App) and automatically seed data (`http://localhost:1110`)** |
| **`make live`** | **ONE-COMMAND: Authenticate, deploy to Cloud Run & seed live data** |
| `make auth` | Safe GCP authentication and project binding from `.env` |
| `make deploy` | Build and deploy container to Google Cloud Run |
| `make seed` | Run idempotent database seeder (safe to rerun anytime) |
| `make dev` | Run lightweight Vite development server on port 1110 |
| `make compose-down` | Stop local Docker Compose containers |
| `make compose-logs` | Follow live container logs |
| `make check` | Run full validation suite (`npm run lint` + `npm test`) |
| `make clean` | Clean build artifacts and dist/ directory |

---

## Belgian Legal & Ethical Compliance Reference

- **Belgian Law of 7 May 2004 regarding experiments on the human person:**
  - **Article 6:** Voluntary participation, unconditional right of withdrawal at any time without loss of medical care entitlements. *(Locked verbatim in EN, NL, FR)*.
  - **Article 29:** No-fault clinical trial insurance liability. *(Can be modularly excluded for observational/non-interventional research per FAMHP guidelines)*.
- **Paediatric Age Demarcations in Belgium:**
  - **Children (8–11 years):** Assent booklet with visual explanations, simplified procedures, non-legal terminology.
  - **Adolescents (12–17 years):** Assent form detailing study rationale, daily routine, privacy, and voluntary consent alongside parental authorization.
  - **Parents / Legal Guardians:** Full legal informed consent form pursuant to Belgian parental authority law.
  - **Adults (18+):** Full standard Belgian adult clinical trial consent form.
- **GDPR & Health Data Protection:**
  - Data residency in `europe-west1` (Brussels, Belgium).
  - Explicit separate consent blocks for secondary data use and biobanking.

---

*ConsentFlow was developed as a rapid open innovation demonstration during Hacking for Good 2026. It is intended for educational, research, and technical workflow demonstration purposes.*
