import type { GroundTruthOpportunity } from './verdict-ground-truth.js'

export const VERDICT_GROUND_TRUTH_DATASET_OOS: readonly GroundTruthOpportunity[] = [
  // ── In-Profile Target Roles (WORTH_ATTENTION) ──────────────────────────────────
  {
    id: 'oos-01',
    title: 'Senior Cloud Platform Engineer',
    jd: 'Designing and scaling multi-region cloud infrastructure. Requirements: 5+ years with Go, Kubernetes operator development, Terraform, AWS, and distributed systems architecture.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct match for senior cloud platform infrastructure with Go & K8s.',
  },
  {
    id: 'oos-02',
    title: 'Staff Site Reliability Engineer',
    jd: 'Ensuring global uptime for distributed edge networks. Requires deep Linux kernel tuning, eBPF telemetry, Prometheus monitoring, incident automation, and Go/Python scripting.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Strong match for staff SRE, telemetry, and Linux systems internals.',
  },
  {
    id: 'oos-03',
    title: 'Principal Distributed Systems Architect',
    jd: 'Architecting next-generation distributed consensus and storage engines. Requirements: Rust or C++, Raft protocol implementation, high-throughput low-latency network I/O, and fault tolerance.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for principal distributed systems architect with Rust/C++ experience.',
  },
  {
    id: 'oos-04',
    title: 'Senior Systems Infrastructure Engineer',
    jd: 'Building high-performance backend infrastructure. Requires strong experience with C++/Go, Linux kernel memory management, custom allocators, and lock-free data structures.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct fit for systems infrastructure and low-level performance engineering.',
  },
  {
    id: 'oos-05',
    title: 'Lead Cloud Infrastructure Engineer',
    jd: 'Leading automated cloud platform team. Requires custom Kubernetes controller development in Go, Crossplane, Terraform provider creation, and multi-cloud architecture.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for lead cloud infrastructure and Kubernetes operator engineering.',
  },
  {
    id: 'oos-06',
    title: 'Staff Storage Engine Engineer',
    jd: 'Designing high-throughput distributed storage engines. Requires Rust/C++, NVMe-oF, LSM-tree indexing algorithms, and zero-copy network serialization.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Strong match for storage engine internals and low-level distributed storage.',
  },
  {
    id: 'oos-07',
    title: 'Senior Low-Latency Network Engineer',
    jd: 'Optimizing packet processing pipelines for financial data feeds. Requires DPDK, eBPF, TCP/IP stack optimization in C/Rust, and kernel bypass networking.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct match for low-latency networking and kernel-bypass systems.',
  },
  {
    id: 'oos-08',
    title: 'Principal Cloud Resiliency Engineer',
    jd: 'Architecting active-active multi-region cloud services. Requires chaos engineering expertise, event-driven architecture, Go/Java microservices, and automated failover systems.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for cloud reliability and fault-tolerant distributed systems.',
  },
  {
    id: 'oos-09',
    title: 'Senior Platform Tooling & CLI Engineer',
    jd: 'Building developer infrastructure and CLI tools. Requires experience in Rust or Go, Bazel build graph optimization, Language Server Protocol (LSP), and CI/CD pipelines.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Strong match for platform tooling, CLI development, and developer experience.',
  },
  {
    id: 'oos-10',
    title: 'Staff Payment Engine Infrastructure Engineer',
    jd: 'Scaling transactional payment engine. Requires double-entry ledger architecture, high-concurrency Kafka event streams, PostgreSQL transaction isolation, and Go/Java.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct match for backend payment platform and high-concurrency ledgers.',
  },
  {
    id: 'oos-11',
    title: 'Senior Cloud Security Infrastructure Engineer',
    jd: 'Architecting zero-trust cloud security tools. Requires automated PKI infrastructure, SPIFFE/SPIRE identity attestation, eBPF security profiling, and Go/Rust development.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for cloud security infrastructure and automated security tools.',
  },
  {
    id: 'oos-12',
    title: 'Senior Distributed Microservices Engineer',
    jd: 'Building core microservices foundation. Requires gRPC protocol buffers, Envoy proxy configuration, Istio service mesh, Go microservices, and open tracing.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct match for backend microservices and cloud-native service mesh.',
  },
  {
    id: 'oos-13',
    title: 'Staff Backend Performance Engineer',
    jd: 'Profiling and optimizing large-scale distributed backend services. Requires JVM and Go runtime profiling, CPU cache optimization, flamegraph analysis, and tracing.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for systems performance, runtime profiling, and backend tuning.',
  },
  {
    id: 'oos-14',
    title: 'Senior Cloud Networking Architect',
    jd: 'Designing software-defined cloud networking infrastructure. Requires BGP routing, VPC overlay networks, custom gateway software in Go/C, and high-bandwidth transit.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Strong match for software-defined networking and cloud connectivity.',
  },
  {
    id: 'oos-15',
    title: 'Staff Infrastructure Automation Engineer',
    jd: 'Building internal infrastructure-as-code platforms. Requires Go, Terraform custom provider development, Crossplane controllers, and GitOps workflows at scale.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'Direct match for infrastructure automation and platform engineering.',
  },
  {
    id: 'oos-16',
    title: 'Senior Database Platform Engineer',
    jd: 'Managing distributed database infrastructure. Requires PostgreSQL internal tuning, connection proxying (pgBouncer/Pgpool), raft-based high-availability failover, and Go.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for database platform engineering and distributed data stores.',
  },

  // ── Out-of-Sample Border Cases & Non-Target Roles (NOT_WORTH) ─────────────────

  // Category 1: Cloud Solutions Architect
  {
    id: 'oos-17',
    title: 'Senior Cloud Solutions Architect',
    jd: 'Working directly with enterprise customers to deliver AWS Well-Architected reviews, technical pre-sales presentations, RFP responses, and migration advisory sessions.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Customer-facing solutions architect / pre-sales consulting role.',
  },
  {
    id: 'oos-18',
    title: 'Principal Partner Solutions Architect',
    jd: 'Building relationships with Global System Integrators (GSIs). Creating joint solution briefs, partner sales collateral, executive workshops, and cloud partner enablement.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Partner alliance and business development solutions role.',
  },
  {
    id: 'oos-19',
    title: 'Enterprise Cloud Migration Architect',
    jd: 'Leading customer legacy-to-cloud assessment frameworks. Managing non-technical executive stakeholders, total cost of ownership (TCO) financial modeling, and cloud adoption strategy.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Financial advisory and enterprise cloud migration consulting.',
  },

  // Category 2: Technical Product Manager (TPM)
  {
    id: 'oos-20',
    title: 'Senior Technical Product Manager - Cloud Infrastructure',
    jd: 'Defining product roadmap for internal developer platform. Gathering requirements from software teams, writing PRDs, managing JIRA backlogs, and leading sprint planning sessions.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Technical Product Management / backlog prioritization role.',
  },
  {
    id: 'oos-21',
    title: 'Principal TPM - Developer Platform',
    jd: 'Aligning executive stakeholders across product and engineering. Tracking cross-functional delivery milestones, managing quarterly planning cycles, and writing product specs.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Product management and cross-team project coordination.',
  },
  {
    id: 'oos-22',
    title: 'Staff Infrastructure Program Manager',
    jd: 'Managing complex infrastructure delivery schedules, tracking vendor hardware dependencies, building Gantt charts, managing infrastructure budget, and presenting executive status reports.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Program management and hardware logistics tracking.',
  },

  // Category 3: Developer Advocate / DevRel
  {
    id: 'oos-23',
    title: 'Senior Developer Advocate - Cloud Native',
    jd: 'Speaking at international tech conferences, writing technical blog posts, building demo applications, engaging on Twitter/X and Discord, and advocating for developer feedback internally.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Public advocacy, content creation, and developer relations role.',
  },
  {
    id: 'oos-24',
    title: 'Lead Developer Relations Engineer',
    jd: 'Organizing global hackathons, leading open-source community engagement, conducting developer sentiment surveys, and creating developer onboarding collateral.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Community management and hackathon event coordination.',
  },
  {
    id: 'oos-25',
    title: 'Developer Experience Content Specialist',
    jd: 'Creating video tutorials, hosting live coding streams, writing step-by-step quickstart guides, and moderating community forums.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Video content production and community moderation.',
  },

  // Category 4: Sales Engineer / Solutions Engineer
  {
    id: 'oos-26',
    title: 'Senior Enterprise Sales Engineer',
    jd: 'Partnering with Account Executives to deliver technical product demonstrations, building custom proof-of-concept (POC) solutions for sales prospects, and carrying a sales quota.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Pre-sales technical demo and quota-carrying sales engineering.',
  },
  {
    id: 'oos-27',
    title: 'Solutions Engineer - EMEA',
    jd: 'Answering technical RFPs/RFIs for prospective customers, supporting sales discovery calls, and handling customer technical objections during sales negotiations.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Sales discovery and RFP technical response engineering.',
  },
  {
    id: 'oos-28',
    title: 'Principal Pre-Sales Systems Engineer',
    jd: 'Meeting with prospect C-suite executives, performing ROI and cost savings calculations, validating technical feasibility for commercial proposals, and closing sales deals.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Pre-sales commercial deal validation and ROI modeling.',
  },

  // Category 5: Edge IoT Engineer / Embedded Firmware
  {
    id: 'oos-29',
    title: 'Senior Embedded Firmware Engineer',
    jd: 'Writing low-level C bare-metal firmware for STM32 microcontrollers. Developing RTOS tasks, SPI/I2C sensor drivers, interrupt handlers, and hardware abstraction layers.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Microcontroller firmware and bare-metal embedded C programming.',
  },
  {
    id: 'oos-30',
    title: 'IoT Edge Systems Engineer',
    jd: 'Implementing Zigbee and BLE radio protocol stacks on constrained battery-powered hardware. Reviewing PCB hardware schematics and measuring power consumption on logic analyzers.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Hardware PCB review, radio protocols, and ultra-low-power electronics.',
  },
  {
    id: 'oos-31',
    title: 'Microcontroller Firmware Architect',
    jd: 'Architecting low-power firmware on Nordic nRF52 chipsets using C and Assembly. Configuring hardware registers, DMA controllers, and power-saving sleep modes.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Low-level register manipulation and chip-level assembly programming.',
  },

  // Category 6: Security Auditor / Compliance Analyst
  {
    id: 'oos-32',
    title: 'Senior SOC 2 & ISO 27001 Compliance Auditor',
    jd: 'Auditing organizational security controls, collecting evidence spreadsheets, writing corporate security policies, and coordinating external SOC 2 Type II audit engagements.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Compliance auditing, policy writing, and spreadsheet evidence collection.',
  },
  {
    id: 'oos-33',
    title: 'IT Security Compliance Lead',
    jd: 'Evaluating third-party vendor risk assessments, answering customer HIPAA and GDPR questionnaires, and maintaining corporate risk registers.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Vendor risk management and regulatory questionnaire processing.',
  },
  {
    id: 'oos-34',
    title: 'Information Security Audit Manager',
    jd: 'Planning internal IT audit schedules, presenting security compliance reports to the board of directors, and enforcing NIST framework governance across corporate teams.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Governance, risk, and corporate IT security management.',
  },

  // Category 7: Data BI Analyst
  {
    id: 'oos-35',
    title: 'Senior Business Intelligence Developer',
    jd: 'Designing Tableau and PowerBI dashboards for business executives. Writing complex SQL queries in Snowflake, building ELT data pipelines, and reporting company KPIs.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: BI dashboard creation and SQL data reporting.',
  },
  {
    id: 'oos-36',
    title: 'Lead Data Analyst - Marketing & Sales',
    jd: 'Analyzing Google Analytics 4 data, extracting Hubspot marketing metrics, evaluating customer acquisition costs (CAC), and building Looker dashboards.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Marketing analytics and sales conversion reporting.',
  },
  {
    id: 'oos-37',
    title: 'Analytics Engineer - Financial Reporting',
    jd: 'Building dbt models for revenue forecasting, optimizing SQL queries for financial reconciliation, and maintaining executive financial metrics.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Financial data modeling and revenue forecasting.',
  },

  // Category 8: Technical Writer
  {
    id: 'oos-38',
    title: 'Senior API Technical Writer',
    jd: 'Authoring OpenAPI specs and Markdown documentation for public REST APIs. Maintaining developer portals, writing release notes, and standardizing technical terminology.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: API documentation writing and developer portal copyediting.',
  },
  {
    id: 'oos-39',
    title: 'Staff Technical Content Engineer',
    jd: 'Writing user manuals, creating step-by-step customer troubleshooting guides, reviewing engineering design docs for grammar, and enforcing style guides.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: User manual writing and editorial copyediting.',
  },
  {
    id: 'oos-40',
    title: 'Developer Documentation Specialist',
    jd: 'Maintaining GitBook developer documentation, updating SDK usage tutorials, and managing developer onboarding guides.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Documentation site maintenance and tutorial writing.',
  },

  // Category 9: Office Manager / Operations
  {
    id: 'oos-41',
    title: 'Workplace Operations & Office Manager',
    jd: 'Managing office snack and coffee supplies, coordinating desk allocations, arranging corporate lunch catering, and managing keycard access badges.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Office admin, workplace catering, and physical access management.',
  },
  {
    id: 'oos-42',
    title: 'Facilities Administrator',
    jd: 'Managing contracts for office HVAC maintenance, negotiating lease agreements, coordinating office moves, and setting up event spaces.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Facilities maintenance and building operations.',
  },
  {
    id: 'oos-43',
    title: 'Executive Administrative Assistant',
    jd: 'Managing complex executive calendars, organizing travel itineraries, processing expense reports in Concur, and taking meeting minutes for VP leadership.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Executive assistant, travel scheduling, and expense processing.',
  },

  // Category 10: Procurement & Sourcing
  {
    id: 'oos-44',
    title: 'Senior IT Procurement Specialist',
    jd: 'Negotiating enterprise SaaS vendor contracts, reducing software licensing costs, tracking renewal dates, and issuing purchase orders.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: SaaS contract negotiation and IT software purchasing.',
  },
  {
    id: 'oos-45',
    title: 'Vendor Relations & Sourcing Manager',
    jd: 'Running hardware and software RFP bidding processes, evaluating supplier SLAs, negotiating payment terms, and managing vendor performance metrics.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Vendor SLA monitoring and commercial contract sourcing.',
  },
  {
    id: 'oos-46',
    title: 'Global Software Sourcing Lead',
    jd: 'Managing enterprise-wide software license agreements, conducting annual vendor true-ups, and reconciling software invoices against budget.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Software licensing compliance and invoice reconciliation.',
  },

  // Additional OOS Border Case Opportunities
  {
    id: 'oos-47',
    title: 'Senior Cloud Solutions Consultant',
    jd: 'Delivering cloud readiness assessments for external consulting clients, presenting slides to client IT directors, and building cloud architecture recommendations in PowerPoint.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Management consulting and client presentation delivery.',
  },
  {
    id: 'oos-48',
    title: 'Technical Product Lead - Security Operations',
    jd: 'Defining product strategy for security incident response dashboards, interviewing SOC analysts, creating wireframes, and prioritizing feature user stories.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Product vision and wireframe design for security products.',
  },
  {
    id: 'oos-49',
    title: 'Lead Technical Evangelist',
    jd: 'Keynote speaker for cloud tech summits, host of weekly developer podcasts, producing video courses on cloud architecture, and building developer brand awareness.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Public speaking, podcast hosting, and video production.',
  },
  {
    id: 'oos-50',
    title: 'Solutions Architect - Financial Services',
    jd: 'Advising banking clients on cloud adoption, preparing architecture diagrams for sales proposals, and delivering technical workshops to client project teams.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Client banking advisory and pre-sales architecture workshops.',
  },
  {
    id: 'oos-51',
    title: 'IoT Hardware Validation Engineer',
    jd: 'Testing circuit boards with oscilloscopes and logic analyzers, hand-soldering prototype components, and running environmental chamber temperature stress tests.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Hardware lab testing, soldering, and environmental chamber testing.',
  },
  {
    id: 'oos-52',
    title: 'Senior PCI & GDPR Compliance Analyst',
    jd: 'Mapping international data privacy regulations to internal corporate practices, conducting gap analysis reports, and preparing annual compliance documentation.',
    groundTruth: 'NOT_WORTH',
    notes: 'Out-of-sample: Data privacy regulatory mapping and compliance documentation.',
  },
]
