import type {
  Identity,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Capability,
  Evidence,
  Contribution,
  Preferences,
} from './types.js'
import type { PreferenceSet } from './preference-set.js'

export interface Profile {
  readonly identity: Identity
  readonly experiences: readonly Experience[]
  readonly projects: readonly Project[]
  readonly education: readonly Education[]
  readonly publications: readonly Publication[]
  readonly certifications: readonly Certification[]
  readonly recommendations: readonly Recommendation[]
  readonly capabilities: readonly Capability[]
  readonly evidence: readonly Evidence[]
  readonly contributions?: readonly Contribution[]
  /** @deprecated Use preferenceSet instead. Retained for YAML workspace compatibility. */
  readonly preferences?: Preferences
  /** O2.1: structured preferences — authoritative when present. */
  readonly preferenceSet?: PreferenceSet
}

export const EMBEDDED_PROFILE: Profile = {
  "identity": {
    "person": {
      "name": "Valentín Liñeiro Barea",
      "title": "Staff Software Engineer | Software Architecture | Developer Productivity | AI-Assisted Engineering",
      "summary": "Staff Software Engineer focused on software architecture, developer productivity, and AI-assisted engineering. I help teams evolve complex systems by reducing technical friction, modernizing architecture incrementally, and turning emerging technologies into practical engineering capabilities. I enjoy building tools and systems that make software development simpler, more reliable, and easier to maintain.",
      "urls": {},
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    "experienceIds": [
      "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "fbb1aa2d-a3ef-4f36-9edb-ecc18509ae03",
      "406503ae-63be-46e4-b7a1-c22f1bc473a8",
      "7b6efa67-f0db-459c-a110-3ae58d6236a8",
      "477ec0bc-1636-4f5e-9923-1bd2316efffc"
    ],
    "projectIds": [
      "810fe6dd-05d5-4d8a-a534-5fa6c6d5bf94",
      "53797b09-5e5c-4d48-a5d5-c51c82875b88"
    ],
    "educationIds": [
      "edu-1",
      "edu-2"
    ],
    "publicationIds": [],
    "certificationIds": [
      "61957f6d-2921-46a4-9014-0ba478ceb315",
      "84fca6ef-f350-4653-9494-39aa6ff77023",
      "e818f6e0-ee8f-45ca-9042-83da5dcb90ab",
      "6e508824-5a30-4b65-a46a-1040bdeab58e",
      "f0755282-8a01-4a66-a7b1-1d1cbd3164c2",
      "48f81c26-65ab-40c8-89e6-508484c6820d"
    ],
    "recommendationIds": [],
    "capabilityIds": [
      "f8f2ce27-6d36-4d45-9622-112aded6fcd5",
      "a7c18e4f-6124-46c8-87f9-51be8a8c3843",
      "72e03a49-5880-401e-8aec-c1f6c0b21efd",
      "140e92d7-f793-4001-a737-7acf8e319871",
      "c1ca533e-199c-41c8-a4e5-b0f2901ffe18",
      "354ab922-0901-4b49-9378-5952bb680b89",
      "cb1676fd-9cf9-4e64-b1e7-f4d023edefc8",
      "efe55daf-2a9a-4ea6-bb79-0ce3228f5e8d",
      "aecf03a0-e35d-4b3a-aba9-aec91a862d5e",
      "4058c79d-0ba8-4a20-bfce-e4a8df5fd971",
      "8ec73bea-4eaf-4574-b250-5c47b7cb038b",
      "2e1a0367-03e6-46ec-ab31-33e60a3e1c29",
      "49dd7b2b-0dc6-4d4a-86ba-5a409e0ac610",
      "7ab84b2f-5ef0-4619-8784-c700f27c2694",
      "420b07b6-c49e-43ee-a409-f569e60378ab",
      "e04c4fe8-7f64-4b3a-96e6-e2b729b09b06",
      "96644e82-3f15-4d00-842c-207a9af76db9",
      "5cdea70c-e1b8-4699-abec-cbc326ba0ab1",
      "dbda0e3e-2592-4f27-98f6-147d341a8fc8",
      "995557c1-b741-4e9b-bdfb-4e34dbf55989",
      "463c0c30-d80b-4287-b435-e5aea69785fb",
      "8b0eeaff-e59d-47d1-b3c5-3882cb5ea490",
      "2051d54c-119b-4967-9131-0eadee354ae3",
      "59a7b5d2-e924-418a-a7ad-6037b7e539c1",
      "5c5da9af-cf39-48f1-a605-190786f80921",
      "252fc0de-b99e-45dc-8ad0-0832f2c0d1c3",
      "5e6d4306-782a-462f-87ba-cef26e293f3d",
      "005e1053-dde3-4a5a-8360-f7a1d907866e",
      "fb1c751b-d2a6-4109-acbe-c5d7a4625abe",
      "f0768993-90de-4d4f-b262-bce2dde57acd",
      "82fa515f-0f43-4685-96f3-051832cece8f",
      "12d370ae-ebcd-4190-833a-66985f83be46",
      "de7e9885-3680-46db-8497-822bacae9ac1",
      "84f33db4-1a56-43ce-b04a-8db818a024c3",
      "37668881-f368-48c3-bb3c-66301f9ea573",
      "82f61c1e-214a-4225-9aa9-0fdeeedd1a07",
      "f015666b-67f0-4f20-a0a2-de593c30761a",
      "83b0f4db-2236-4ddf-ad3d-755c18da12a4",
      "d4f60d62-fa43-46f8-8581-7025dde513a6",
      "5a58add3-20db-4a69-8827-40f99a0dc59b",
      "2bc7a84e-05f8-4f95-b4bf-6170e76e475a",
      "b167cfb0-6125-4046-b59f-d9c8fa210a52",
      "d7592ad4-a15c-4dfc-b316-083431064b55",
      "4a895d31-9ae4-4d68-8ca3-3c985af6bef1",
      "e3c7479a-ed90-43cd-9444-3ef7b1d6854d",
      "71cb594f-94a8-49a0-b645-5befb2f74eed",
      "e5e37aa2-a306-433c-bd79-fbdf815bf279",
      "74e85b27-d7ac-4121-a4a6-a0a295aead3b",
      "c256343b-f5cb-4617-967b-d749687f0a57",
      "1ea6e7de-a795-4893-a8fe-1fa33e1bf7e4",
      "86791087-2d38-4f45-8e0c-bbc7b2521176",
      "4c906a6a-962b-4cb5-87f5-b59c501efd1f",
      "9037cd02-b563-48ec-81ae-3eaa4ff9f3f9",
      "60458cb8-f297-4bb4-a7b8-17a4b7193722",
      "2fc44dfa-0a08-481d-a7b9-e918210b2676",
      "3bd5ef4b-a75d-41ec-bf09-ba26cc11ad2c",
      "b7f41439-937a-4993-a48d-62e010a5c963",
      "aa6a4c54-935b-4d36-96b2-ce0e5d0f3f75",
      "8a455238-9100-44a8-b820-cde3a1be728d",
      "22a4a709-b95c-45c6-a165-bd1e2e06d7e4",
      "11c1b3e0-05d5-4aef-be81-b43266960402",
      "05662f57-596f-4e9f-ab39-93d1fe102ba9",
      "4f98ba57-0f68-4fec-834a-696eafb3daf4",
      "abb3cecd-285e-424b-bdff-889d85605fb8",
      "a711b017-ca8a-431c-ba96-5d04a4639e3f",
      "7c639d01-1906-417b-8b11-0252f80ee8b8",
      "73fb085e-3daf-4c87-9278-6d9699b95684",
      "80b85151-9f9d-46f1-9a4d-6a88fde95f0a",
      "e22ad058-ecd8-447f-b04b-42a6421cff48",
      "a623ac26-20ea-4d85-b576-160f1f5a2c41",
      "c07ed2a8-fadd-494a-a9e8-0c7236aeac93",
      "247c3df9-1f2e-48f1-87ad-fa824e2be3b2",
      "a7c5059b-bf5f-4ad1-85d6-450a159c2117",
      "a578edcf-f03d-4dd0-901d-1c0c9684fc50"
    ],
    "contributionIds": [
      "summa-clean-architecture",
      "summa-ai-assisted-engineering",
      "summa-roadmap-ownership-4g-core",
      "summa-telecom-modernization",
      "summa-maintainability-velocity"
    ]
  },
  "experiences": [
    {
      "id": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "organization": "Summa Networks",
      "title": "Senior Software Engineer",
      "start": "2025-10",
      "location": "Cádiz, Andalusia, Spain · Remote",
      "summary": "I design internal systems that improve how engineering teams build, review, onboard, and deliver software. My work combines software architecture, developer productivity, and AI-assisted engineering to reduce friction, improve decision-making, and help teams work with more leverage.",
      "achievements": [],
      "technologies": [
        "Java",
        "Spring",
        "Clean Architecture",
        "4G Network Core",
        "AI-Assisted Engineering"
      ],
      "capabilityIds": [],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "fbb1aa2d-a3ef-4f36-9edb-ecc18509ae03",
      "organization": "knowmad mood",
      "title": "Senior Software Engineer",
      "start": "2021-07",
      "end": "2025-10",
      "summary": "Software consulting across multiple clients and domains. Built a solid foundation in distributed systems, microservices, and cloud, working with Spring Boot, Kafka, Kubernetes, and Azure in real production environments. Learned to adapt quickly to different contexts, understand unfamiliar systems, and add value in changing environments. A growth phase as a generalist engineer: moved from writing code to understanding complete systems — APIs, messaging, databases, deployments, CI/CD, operations. Technical communication in consulting was a school: aligning decisions with different teams and ensuring solutions stayed maintainable for those who received them.",
      "achievements": [
        "Worked with distributed architectures, microservices, and cloud (Spring Boot, Kafka, Docker, Kubernetes, Azure) in real production systems",
        "Developed the ability to adapt quickly to different clients, contexts, and domains",
        "Evolved from writing code to understanding complete systems — APIs, messaging, databases, CI/CD, operations",
        "Learned to align technical decisions with different teams and client cultures, ensuring long-term maintainability",
        "Built the technical foundations that later enabled a move toward architecture, productivity, and AI responsibilities",
        "Designed scalable backend services with Java, Spring Boot, Kafka, and MongoDB, improving system capacity by 40%"
      ],
      "technologies": [
        "Java",
        "Spring Boot",
        "Apache Kafka",
        "Kubernetes",
        "Microsoft Azure"
      ],
      "capabilityIds": [
        "f015666b-67f0-4f20-a0a2-de593c30761a",
        "84f33db4-1a56-43ce-b04a-8db818a024c3",
        "995557c1-b741-4e9b-bdfb-4e34dbf55989",
        "7c639d01-1906-417b-8b11-0252f80ee8b8",
        "dbda0e3e-2592-4f27-98f6-147d341a8fc8"
      ],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "406503ae-63be-46e4-b7a1-c22f1bc473a8",
      "organization": "VINCLE",
      "title": "Software Engineer",
      "start": "2017-01",
      "end": "2021-06",
      "location": "Greater Cádiz Metropolitan Area",
      "summary": "Led the migration of a legacy CRM/SFA application toward a Spring Boot  and Angular-based architecture, improving maintainability and preparing the  platform for further evolution. Led a frontend team and participated in  architecture decisions across backend systems, integrations, and  business-critical functionality in a production environment.",
      "achievements": [
        "Led the migration of a legacy CRM/SFA to Spring Boot and Angular, improving maintainability and enabling future evolution",
        "Led a frontend team and participated in architecture decisions across backend, integrations, and business-critical functionality"
      ],
      "technologies": [
        "Java",
        "Spring Boot",
        "Angular",
        "Legacy Migration"
      ],
      "capabilityIds": [
        "84f33db4-1a56-43ce-b04a-8db818a024c3"
      ],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "7b6efa67-f0db-459c-a110-3ae58d6236a8",
      "organization": "Universidad de Cádiz",
      "title": "Research Assistant",
      "start": "2014-06",
      "end": "2015-12",
      "location": "Cádiz, Spain",
      "summary": "Conducted research within the Department of Mathematics as part of the UCASE research group, focusing on knowledge extraction, fuzzy logic, and computational methods for discovering structure in complex information. Contributed to published research while developing analytical and experimental approaches that continue to influence engineering practice.",
      "achievements": [
        "Contributed to research published within the UCASE group",
        "Worked on knowledge extraction techniques from complex datasets",
        "Applied Fuzzy Formal Concept Analysis to knowledge representation problems",
        "Explored computational methods for pattern discovery and information structuring",
        "Developed an experimental and evidence-driven approach to technical problem solving"
      ],
      "technologies": [
        "Fuzzy Logic",
        "Formal Concept Analysis",
        "Python",
        "Knowledge Extraction"
      ],
      "capabilityIds": [
        "86791087-2d38-4f45-8e0c-bbc7b2521176"
      ],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "477ec0bc-1636-4f5e-9923-1bd2316efffc",
      "organization": "Universidad de Cádiz",
      "title": "Software Developer",
      "start": "2013-10",
      "end": "2014-04",
      "location": "Cádiz, Spain",
      "summary": "Designed internal software for the University of Cádiz Research Transfer Office while contributing to research on mutation testing and formal verification. This role combined practical software engineering with academic research, laying the foundations for a systematic approach to software quality and problem solving.",
      "achievements": [
        "Designed and implemented an internal management application for the University's Research Transfer Office",
        "Improved internal operational workflows through custom software development",
        "Contributed to research on mutation testing and formal verification",
        "Combined production software development with academic research activities",
        "Built the foundations of a rigorous engineering approach focused on software quality"
      ],
      "technologies": [
        "Java",
        "Python",
        "Mutation Testing",
        "Formal Verification"
      ],
      "capabilityIds": [],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    }
  ],
  "projects": [
    {
      "id": "810fe6dd-05d5-4d8a-a534-5fa6c6d5bf94",
      "name": "Autoseed — Mutation-based Test Generation",
      "description": "Research project focused on improving software reliability through automated test generation techniques.  Developed mutation-based approaches to generate and optimize test suites for service-oriented architectures.",
      "url": "https://neptuno.uca.es/redmine/projects/sources-fm/repository/show/trunk/src/test-generator-autoseed",
      "technologies": [],
      "capabilityIds": [],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "53797b09-5e5c-4d48-a5d5-c51c82875b88",
      "name": "WS-BPEL Mutation Operators",
      "description": "Research project exploring mutation testing strategies to improve test coverage and fault detection in WS-BPEL 2.0 systems.  Designed new mutation operators to evaluate software quality and testing effectiveness.",
      "url": "https://neptuno.uca.es/redmine/projects/sources-fm/repository/show/trunk/src/mubpel/src/main/resources/es/uca/webservices/mutants/operators",
      "technologies": [],
      "capabilityIds": [],
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "Universidad de Cádiz",
      "degree": "Ingeniero en Informática",
      "field": "Computer/Information Technology Administration and Management",
      "start": "2011",
      "end": "2014"
    },
    {
      "id": "edu-2",
      "institution": "Universidad de Cádiz",
      "degree": "Ingeniero Técnico En Informática De Sistemas",
      "field": "Computer/Information Technology Administration and Management",
      "start": "2008",
      "end": "2011"
    }
  ],
  "publications": [],
  "certifications": [
    {
      "id": "61957f6d-2921-46a4-9014-0ba478ceb315",
      "name": "Certificate of Completion: Al Fluency Framework & Foundations",
      "issuer": "Anthropic",
      "date": "2026-04",
      "url": "https://verify.skilljar.com/c/fftjskxaa45g",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "84fca6ef-f350-4653-9494-39aa6ff77023",
      "name": "AI for App Building",
      "issuer": "Google",
      "date": "2026-06",
      "url": "https://www.coursera.org/account/accomplishments/records/IIC0M9UN6GXH",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "e818f6e0-ee8f-45ca-9042-83da5dcb90ab",
      "name": "Google AI Professional Certificate",
      "issuer": "Google",
      "date": "2026-06",
      "url": "https://www.coursera.org/account/accomplishments/specialization/GBOYA2UG9TPS",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "6e508824-5a30-4b65-a46a-1040bdeab58e",
      "name": "Building with the Claude API",
      "issuer": "Anthropic",
      "date": "2026-06",
      "url": "https://verify.skilljar.com/c/3zpcze52kjo6",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "f0755282-8a01-4a66-a7b1-1d1cbd3164c2",
      "name": "Model Context Protocol: Advanced Topics",
      "issuer": "Anthropic",
      "date": "2026-06",
      "url": "https://verify.skilljar.com/c/az8hz77f8vj6",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "48f81c26-65ab-40c8-89e6-508484c6820d",
      "name": "Claude with Google Cloud's Vertex AI",
      "issuer": "Anthropic",
      "date": "2026-06",
      "url": "https://verify.skilljar.com/c/wq5orj4fhey3",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    }
  ],
  "recommendations": [],
  "capabilities": [
    {
      "id": "f8f2ce27-6d36-4d45-9622-112aded6fcd5",
      "name": "Software Engineering Practices",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "a7c18e4f-6124-46c8-87f9-51be8a8c3843",
      "name": "Mutation Testing",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "72e03a49-5880-401e-8aec-c1f6c0b21efd",
      "name": "Technical Leadership",
      "evidenceIds": [],
      "signals": [
        "technical leadership",
        "technical direction",
        "technical ownership",
        "drive technical decisions",
        "mentor engineers",
        "lead engineering initiatives",
        "technical roadmap",
        "engineering lead",
        "technical challenges",
        "root causes",
        "long-term improvements"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "140e92d7-f793-4001-a737-7acf8e319871",
      "name": "Formal Verification",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "c1ca533e-199c-41c8-a4e5-b0f2901ffe18",
      "name": "Internal Tools",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "354ab922-0901-4b49-9378-5952bb680b89",
      "name": "Software Design",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "cb1676fd-9cf9-4e64-b1e7-f4d023edefc8",
      "name": "Formal Concept Analysis",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "efe55daf-2a9a-4ea6-bb79-0ce3228f5e8d",
      "name": "Data Analysis",
      "evidenceIds": [],
      "signals": [
        "data analysis",
        "data analytics"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "aecf03a0-e35d-4b3a-aba9-aec91a862d5e",
      "name": "Fuzzy Logic",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "4058c79d-0ba8-4a20-bfce-e4a8df5fd971",
      "name": "Knowledge Extraction",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "8ec73bea-4eaf-4574-b250-5c47b7cb038b",
      "name": "Legacy Systems",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "2e1a0367-03e6-46ec-ab31-33e60a3e1c29",
      "name": "Front-End Development",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "49dd7b2b-0dc6-4d4a-86ba-5a409e0ac610",
      "name": "Developer Productivity",
      "evidenceIds": [],
      "signals": [
        "developer productivity",
        "developer experience",
        "devops",
        "ci/cd",
        "build tooling",
        "internal tools",
        "engineering efficiency"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "7ab84b2f-5ef0-4619-8784-c700f27c2694",
      "name": "AI-Assisted Engineering",
      "evidenceIds": [],
      "signals": [
        "ai-assisted engineering",
        "ai-assisted development",
        "ai engineering",
        "llm",
        "genai",
        "ai tools",
        "artificial intelligence",
        "mlops",
        "workflow orchestration",
        "model lifecycle management"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "420b07b6-c49e-43ee-a409-f569e60378ab",
      "name": "Software Architecture",
      "evidenceIds": [],
      "signals": [
        "software architecture",
        "system architecture",
        "architectural design",
        "architecture decisions",
        "architectural decisions",
        "design systems",
        "technical design",
        "clean architecture",
        "scalable architectures"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "e04c4fe8-7f64-4b3a-96e6-e2b729b09b06",
      "name": "Artificial Intelligence (AI)",
      "evidenceIds": [],
      "signals": [
        "artificial intelligence",
        "applied ai",
        "generative ai",
        "ai"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "96644e82-3f15-4d00-842c-207a9af76db9",
      "name": "Agentic AI Development",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "5cdea70c-e1b8-4699-abec-cbc326ba0ab1",
      "name": "Distributed Systems",
      "evidenceIds": [],
      "signals": [
        "distributed systems",
        "distributed architecture",
        "high availability",
        "fault tolerance",
        "scalability",
        "microservices",
        "messaging systems",
        "event-driven"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "dbda0e3e-2592-4f27-98f6-147d341a8fc8",
      "name": "Cloud-Native Architecture",
      "evidenceIds": [],
      "signals": [
        "cloud-native",
        "cloud-native platform",
        "cloud environments",
        "cloud-native technologies"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "995557c1-b741-4e9b-bdfb-4e34dbf55989",
      "name": "Software Development",
      "evidenceIds": [],
      "signals": [
        "software development",
        "software engineering best practices"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "463c0c30-d80b-4287-b435-e5aea69785fb",
      "name": "Continuous Integration and Continuous Delivery (CI/CD)",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "8b0eeaff-e59d-47d1-b3c5-3882cb5ea490",
      "name": "Retrieval-Augmented Generation (RAG)",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "2051d54c-119b-4967-9131-0eadee354ae3",
      "name": "Model Context Protocol (MCP)",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "59a7b5d2-e924-418a-a7ad-6037b7e539c1",
      "name": "Java",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "5c5da9af-cf39-48f1-a605-190786f80921",
      "name": "Test Automation",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "252fc0de-b99e-45dc-8ad0-0832f2c0d1c3",
      "name": "Software Quality",
      "evidenceIds": [],
      "signals": [
        "software quality",
        "testing strategies",
        "automated testing"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "5e6d4306-782a-462f-87ba-cef26e293f3d",
      "name": "Research Skills",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "005e1053-dde3-4a5a-8360-f7a1d907866e",
      "name": "Automation",
      "evidenceIds": [],
      "signals": [
        "automate platform services",
        "automation"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "fb1c751b-d2a6-4109-acbe-c5d7a4625abe",
      "name": "Software Testing",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "f0768993-90de-4d4f-b262-bce2dde57acd",
      "name": "Google Gemini",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "82fa515f-0f43-4685-96f3-051832cece8f",
      "name": "Anthropic Claude",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "12d370ae-ebcd-4190-833a-66985f83be46",
      "name": "Spring Boot",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "de7e9885-3680-46db-8497-822bacae9ac1",
      "name": "Microservices",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "84f33db4-1a56-43ce-b04a-8db818a024c3",
      "name": "REST APIs",
      "evidenceIds": [],
      "signals": [
        "apis",
        "rest apis"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "37668881-f368-48c3-bb3c-66301f9ea573",
      "name": "Apache Kafka",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "82f61c1e-214a-4225-9aa9-0fdeeedd1a07",
      "name": "Docker Products",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "f015666b-67f0-4f20-a0a2-de593c30761a",
      "name": "Kubernetes",
      "evidenceIds": [],
      "signals": [
        "kubernetes",
        "k8s",
        "kubernetes-based solutions"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "83b0f4db-2236-4ddf-ad3d-755c18da12a4",
      "name": "Microsoft Azure",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "d4f60d62-fa43-46f8-8581-7025dde513a6",
      "name": "Multithreading",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "5a58add3-20db-4a69-8827-40f99a0dc59b",
      "name": "Recogida de basura",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "2bc7a84e-05f8-4f95-b4bf-6170e76e475a",
      "name": "Scrum",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "b167cfb0-6125-4046-b59f-d9c8fa210a52",
      "name": "Kanban",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "d7592ad4-a15c-4dfc-b316-083431064b55",
      "name": "Avro",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "4a895d31-9ae4-4d68-8ca3-3c985af6bef1",
      "name": "Telemetry",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "e3c7479a-ed90-43cd-9444-3ef7b1d6854d",
      "name": "Troubleshooting",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "71cb594f-94a8-49a0-b645-5befb2f74eed",
      "name": "Problem Solving",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "e5e37aa2-a306-433c-bd79-fbdf815bf279",
      "name": "Java Virtual Machine (JVM)",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "74e85b27-d7ac-4121-a4a6-a0a295aead3b",
      "name": "XML",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "c256343b-f5cb-4617-967b-d749687f0a57",
      "name": "Spring Framework",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "1ea6e7de-a795-4893-a8fe-1fa33e1bf7e4",
      "name": "Diseño de software",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "86791087-2d38-4f45-8e0c-bbc7b2521176",
      "name": "Python (Programming Language)",
      "evidenceIds": [],
      "signals": [
        "python"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "4c906a6a-962b-4cb5-87f5-b59c501efd1f",
      "name": "Machine Learning",
      "evidenceIds": [],
      "signals": [
        "machine learning"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "9037cd02-b563-48ec-81ae-3eaa4ff9f3f9",
      "name": "C++",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "60458cb8-f297-4bb4-a7b8-17a4b7193722",
      "name": "Microsoft SQL Server",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "2fc44dfa-0a08-481d-a7b9-e918210b2676",
      "name": "Planificación de pruebas",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "3bd5ef4b-a75d-41ec-bf09-ba26cc11ad2c",
      "name": "Agile Methodologies",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "b7f41439-937a-4993-a48d-62e010a5c963",
      "name": "Ingeniería de software",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "aa6a4c54-935b-4d36-96b2-ce0e5d0f3f75",
      "name": "Patrones de diseño",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "8a455238-9100-44a8-b820-cde3a1be728d",
      "name": "Análisis",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "22a4a709-b95c-45c6-a165-bd1e2e06d7e4",
      "name": "Automatización de pruebas",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "11c1b3e0-05d5-4aef-be81-b43266960402",
      "name": "MongoDB",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "05662f57-596f-4e9f-ab39-93d1fe102ba9",
      "name": "JavaScript",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "4f98ba57-0f68-4fec-834a-696eafb3daf4",
      "name": "HTML5",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "abb3cecd-285e-424b-bdff-889d85605fb8",
      "name": "Git",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "a711b017-ca8a-431c-ba96-5d04a4639e3f",
      "name": "Linux",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "7c639d01-1906-417b-8b11-0252f80ee8b8",
      "name": "SQL",
      "evidenceIds": [],
      "signals": [
        "sql"
      ],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "73fb085e-3daf-4c87-9278-6d9699b95684",
      "name": "JUnit",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "80b85151-9f9d-46f1-9a4d-6a88fde95f0a",
      "name": "Javascript",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "e22ad058-ecd8-447f-b04b-42a6421cff48",
      "name": "Maven",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "a623ac26-20ea-4d85-b576-160f1f5a2c41",
      "name": "Angular",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "c07ed2a8-fadd-494a-a9e8-0c7236aeac93",
      "name": "Trabajo en equipo",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "247c3df9-1f2e-48f1-87ad-fa824e2be3b2",
      "name": "Inglés",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "a7c5059b-bf5f-4ad1-85d6-450a159c2117",
      "name": "TypeScript",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    },
    {
      "id": "a578edcf-f03d-4dd0-901d-1c0c9684fc50",
      "name": "Metodologías ágiles",
      "evidenceIds": [],
      "provenance": {
        "source": "linkedin",
        "importedAt": "2026-07-30T07:42:17.425Z"
      }
    }
  ],
  "evidence": [],
  "contributions": [
    {
      "id": "summa-clean-architecture",
      "experienceRef": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "summary": "Designed a Clean Architecture proposal for the HSS backend.\n",
      "outcome": {
        "summary": "Adopted as the architectural foundation of the SMSC product.\n"
      },
      "scope": {
        "level": "product",
        "role": "initiator"
      },
      "capabilityIds": [
        "420b07b6-c49e-43ee-a409-f569e60378ab"
      ],
      "technologies": [
        "java",
        "spring"
      ],
      "evidenceIds": []
    },
    {
      "id": "summa-ai-assisted-engineering",
      "experienceRef": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "summary": "Established AI-assisted engineering workflows and acted as internal technical reference.\n",
      "outcome": {
        "summary": "Partnered with company AI Lead to guide internal tooling experiments and team training.\n"
      },
      "scope": {
        "level": "organization",
        "role": "lead"
      },
      "capabilityIds": [
        "7ab84b2f-5ef0-4619-8784-c700f27c2694"
      ],
      "technologies": [
        "AI-Assisted Engineering"
      ],
      "evidenceIds": []
    },
    {
      "id": "summa-roadmap-ownership-4g-core",
      "experienceRef": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "summary": "Evolved role to own the product roadmap and architectural improvements for legacy 4G network core.\n",
      "outcome": {
        "summary": "Shifted engineering execution from ticket-based delivery to strategic product architecture.\n"
      },
      "scope": {
        "level": "product",
        "role": "lead"
      },
      "capabilityIds": [
        "72e03a49-5880-401e-8aec-c1f6c0b21efd",
        "420b07b6-c49e-43ee-a409-f569e60378ab"
      ],
      "technologies": [
        "4G Network Core",
        "Java"
      ],
      "evidenceIds": []
    },
    {
      "id": "summa-telecom-modernization",
      "experienceRef": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "summary": "Drove modernization initiatives across critical telecom backend systems.\n",
      "outcome": {
        "summary": "Upgraded platform capabilities without compromising live network stability.\n"
      },
      "scope": {
        "level": "product",
        "role": "contributor"
      },
      "capabilityIds": [
        "5cdea70c-e1b8-4699-abec-cbc326ba0ab1"
      ],
      "technologies": [
        "Java",
        "Spring"
      ],
      "evidenceIds": []
    },
    {
      "id": "summa-maintainability-velocity",
      "experienceRef": "822fcbb8-f7c8-40a7-bc7d-cb61092c5861",
      "summary": "Streamlined architectural decisions and codebase maintainability across engineering workflows.\n",
      "outcome": {
        "summary": "Reduced team friction and accelerated feature delivery velocity.\n"
      },
      "scope": {
        "level": "team",
        "role": "lead"
      },
      "capabilityIds": [
        "49dd7b2b-0dc6-4d4a-86ba-5a409e0ac610"
      ],
      "technologies": [],
      "evidenceIds": []
    }
  ],
  "preferences": {
    "roles": [
      "Staff Engineer",
      "Principal Engineer",
      "Tech Lead"
    ],
    "work": {
      "remote": "required"
    },
    "compensation": {
      "minimum": 80000,
      "currency": "€"
    },
    "avoid": [
      "Maintenance-only roles",
      "Legacy system migrations without modernization roadmap",
      "Six-round interview processes"
    ],
    "interests": [
      "Software Architecture",
      "Developer Productivity",
      "AI-Assisted Engineering",
      "Distributed Systems",
      "Platform Engineering"
    ]
  }
}

export function getEmbeddedProfile(): Profile {
  return EMBEDDED_PROFILE
}


