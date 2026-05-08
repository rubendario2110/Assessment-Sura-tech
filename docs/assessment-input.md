# Assessment Input (Source of Truth)

Technical Lead – Practical Assessment
Instructions:	Complete	all	sections.	Use	English.	AI	assistance	is	allowed	but	must	be	
disclosed	if	requested	verbally	during	interviews.	For	the	written	submission,	only	deliver	
the	outputs	described	below.
Section A – Architecture & Roadmap
1.	Provide	an	end-to-end	target	architecture	for	a	multi-country	Digital	Direct	Channel,	
addressing	high	availability,	scalability,	resilience,	and	observability.
2.	Include	integration	patterns	such	as	retries,	circuit	breaker,	idempotency,	bulkheads,	
asynchronous	messaging	(if	applicable),	and	caching	strategies.
3.	Provide	a	12-week	technical	roadmap	with	workstreams	for	Reliability,	Integration	
Modernization,	and	Observability/Operations.
4.	Deliverables:	A	written	explanation	and	one	architecture	diagram	(image	or	link).
Section B – Reusable Integration Framework
Implement	a	reusable	integration	component	or	module	that	includes:
- Timeouts,	retries	with	exponential	backoff	and	jitter,	and	a	circuit	breaker	mechanism.
- Centralized	configuration,	unified	logging,	and	trace	propagation	(OpenTelemetry	or	
similar).
- Idempotency	key	support.
Deliverables:	Submit	the	code	(pseudocode	or	implementation)	and	an	explanation	of	the	
design	decisions.
Section C – Demo Service & Reliability Test
Create	a	small	demo	service	that	uses	your	integration	framework	to	call	a	simulated	flaky	
upstream	service.
Demonstrate	expected	behavior	under	failure	conditions	and	describe	how	resilience	
patterns	mitigate	issues.
Deliverables:	A	short	description	of	how	to	run	the	service	and	how	it	behaves	when	the	
upstream	service	fails.
Section D – Technical Decision Record
Write	a	decision	document	comparing:
1.	A	centralized	integration	platform	vs.	decentralized	team-owned	integrations.
2.	Event-driven	vs.	synchronous	request-response	architecture	for	critical	flows.
Deliverables:	Provide	a	one-page	decision	record	with	context,	options,	decision,	and	
consequences.
Submission Format
You	must	submit:
- A	document	containing	all	written	answers.
- Code	or	pseudocode	files	for	the	integration	framework.
- One	architecture	diagram

Recommended usage before running `/specs`:
- Ensure this file contains the latest assessment text.
- Ask the agent to use this file as the baseline source.

Example prompt:
"Run /specs and generate/update all files in specs/ using docs/assessment-input.md as the source of truth."
