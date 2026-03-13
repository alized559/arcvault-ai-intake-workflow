const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const sampleInputs = JSON.parse(fs.readFileSync(path.join(root, 'data', 'sample_inputs.json'), 'utf8'))
const outputRecords = JSON.parse(fs.readFileSync(path.join(root, 'data', 'output_records.json'), 'utf8'))

const queueByCategory = {
  'Bug Report': 'Engineering',
  'Incident/Outage': 'Engineering',
  'Feature Request': 'Product',
  'Billing Issue': 'Billing',
  'Technical Question': 'IT/Security',
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(sampleInputs.length === 6, 'Expected 6 sample inputs.')
assert(outputRecords.length === 6, 'Expected 6 output records.')

const inputIds = new Set(sampleInputs.map((item) => item.request_id))

for (const record of outputRecords) {
  assert(inputIds.has(record.request_id), `Output record ${record.request_id} has no matching input.`)
  assert(typeof record.customer_message === 'string' && record.customer_message.length > 0, `${record.request_id}: missing customer_message.`)
  assert(typeof record.normalized_text === 'string' && record.normalized_text.length > 0, `${record.request_id}: missing normalized_text.`)
  assert(record.classification && typeof record.classification === 'object', `${record.request_id}: missing classification.`)
  assert(record.enrichment && typeof record.enrichment === 'object', `${record.request_id}: missing enrichment.`)
  assert(record.decision && typeof record.decision === 'object', `${record.request_id}: missing decision.`)
  assert(typeof record.summary === 'string' && record.summary.length > 0, `${record.request_id}: missing summary.`)

  const { category, confidence } = record.classification
  const { queue, escalated } = record.decision

  assert(queueByCategory[category], `${record.request_id}: unsupported category ${category}.`)
  assert(typeof confidence === 'number' && confidence >= 0 && confidence <= 1, `${record.request_id}: invalid confidence.`)

  const rawQueue = queueByCategory[category]
  if (!escalated) {
    assert(queue === rawQueue, `${record.request_id}: non-escalated queue should be ${rawQueue}, got ${queue}.`)
  } else {
    assert(queue === 'Escalation Queue', `${record.request_id}: escalated records must route to Escalation Queue.`)
    assert(Array.isArray(record.decision.escalation_reasons) && record.decision.escalation_reasons.length > 0, `${record.request_id}: escalated records need reasons.`)
  }

  if (confidence < 0.7) {
    assert(escalated, `${record.request_id}: low-confidence records must escalate.`)
  }

  if (category === 'Billing Issue') {
    const difference = record.enrichment.relevant_identifiers?.billing_difference_usd
    if (typeof difference === 'number' && difference > 500) {
      assert(escalated, `${record.request_id}: billing discrepancies over $500 must escalate.`)
    }
  }

  if (category === 'Incident/Outage') {
    assert(escalated, `${record.request_id}: incident/outage demo record should escalate.`)
  }
}

console.log('Artifact validation passed.')
