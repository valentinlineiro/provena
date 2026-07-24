# Use cases

## Developer

Your resume shouldn't be a manual copy of your GitHub profile.

```
person.yaml → Identity → resume.md + resume.json
```

Update your experience once. Both outputs reflect the change.

## Freelancer

You maintain a bio for your website, a profile for Upwork, a speaker intro for conferences.

```
person.yaml → Identity → bio.md + speaker-intro.md + website-about.md
```

One source. No stale copies.

## Job seeker

Every application requires a tailored resume. Provena's projection model lets you filter by role:

```bash
provena render my-profile --project backend-engineer
```

Different views, same data. No manual reformatting.

## Consultant

Capability statements, engagement summaries, team bios — same people, different clients.

Provena's evidence-based model ties every claim to specific work:

```
experience.yaml
  └─ achievement: "Reduced latency by 40%"
       └─ evidence: load-test report, PR link
```

Not "I'm good at distributed systems." Proof.
