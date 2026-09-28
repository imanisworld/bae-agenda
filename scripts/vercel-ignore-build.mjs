const ref = (process.env.VERCEL_GIT_COMMIT_REF || '').trim()

const shouldDeploy =
  ref === 'main' ||
  ref === 'staging' ||
  ref.startsWith('preview/') ||
  ref.startsWith('release/')

if (shouldDeploy) {
  console.log(`Vercel build enabled for branch: ${ref || '(unknown)'}`)
  process.exit(1)
}

console.log(`Vercel build skipped for routine branch: ${ref || '(unknown)'}`)
process.exit(0)
