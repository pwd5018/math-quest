# Automatic Firebase Hosting publication

The `Validate and publish Math Quest` workflow validates pushes and pull requests. After validation succeeds, a push to the actual release/default branch, `codex/math-quest-firebase`, builds the live Firebase app and publishes **Hosting only** to `math-quest-2d6e5`. The same branch can be run manually with **Actions → Validate and publish Math Quest → Run workflow**.

Pull requests and other branches never run the publication job. Production deployments are serialized, and a commit superseded before publication is skipped. The workflow checks the hosted files against the exact build using SHA-256 and records the commit and URL in the job summary. A failed verification means the release needs investigation; it does not automatically roll back a deployment that already completed.

This does not deploy database rules, Auth configuration, indexes or Functions. It does not change billing. The existing math, backend-reference and rules-emulator validation still runs before publication.

## One-time connection

The workflow file alone does not grant GitHub permission to deploy. Configure a Google Cloud Workload Identity Federation provider and a dedicated Hosting deploy service account. This exchanges GitHub's short-lived OIDC identity for Google credentials, without storing a service-account private key or a `FIREBASE_TOKEN`.

The following is a **Google Cloud Shell (Bash)** setup recipe for the project owner. These commands create IAM resources and grant the named deploy identity access; they have not been executed by this local update. Review existing resources before running them; existing names should be inspected and reused rather than recreated.

```bash
PROJECT_ID=math-quest-2d6e5
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
SERVICE_ACCOUNT=github-hosting@math-quest-2d6e5.iam.gserviceaccount.com

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project "$PROJECT_ID"

gcloud iam service-accounts create github-hosting \
  --display-name="Math Quest GitHub Hosting deploy" --project "$PROJECT_ID"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT" --role=roles/firebasehosting.admin
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT" --role=roles/serviceusage.serviceUsageConsumer
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT" --role=roles/serviceusage.apiKeysViewer

gcloud iam workload-identity-pools create mathquest-github \
  --location=global --display-name="Math Quest GitHub" --project "$PROJECT_ID"

gcloud iam workload-identity-pools providers create-oidc github \
  --location=global --workload-identity-pool=mathquest-github --project "$PROJECT_ID" \
  --issuer-uri=https://token.actions.githubusercontent.com \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository_id=assertion.repository_id" \
  --attribute-condition="assertion.repository_id == '1435057745' && assertion.repository_owner_id == '246600733' && assertion.ref == 'refs/heads/codex/math-quest-firebase' && assertion.workflow_ref == 'pwd5018/math-quest/.github/workflows/validate.yml@refs/heads/codex/math-quest-firebase' && assertion.event_name in ['push', 'workflow_dispatch']"

gcloud iam service-accounts add-iam-policy-binding "$SERVICE_ACCOUNT" \
  --project "$PROJECT_ID" --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/mathquest-github/attribute.repository_id/1435057745"

printf 'GOOGLE_WORKLOAD_IDENTITY_PROVIDER=projects/%s/locations/global/workloadIdentityPools/mathquest-github/providers/github\n' "$PROJECT_NUMBER"
printf 'GOOGLE_DEPLOY_SERVICE_ACCOUNT=%s\n' "$SERVICE_ACCOUNT"
```

The provider limits trust to this repository's numeric ID, its owner ID, the release branch, this workflow path, and push/manual events. If the repository or release branch changes, update both the workflow and the provider condition. Do not replace these checks with an unrestricted GitHub issuer.

In the repository's **Settings → Environments → production**, add the following **environment variables**. Restrict the environment's deployment branch to `codex/math-quest-firebase`. Required reviewers are optional; omit them if pushes should publish automatically.

| Variable                            | Value                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` | Provider resource name printed above                                      |
| `GOOGLE_DEPLOY_SERVICE_ACCOUNT`     | `github-hosting@math-quest-2d6e5.iam.gserviceaccount.com`                 |
| `VITE_FIREBASE_API_KEY`             | Registered Firebase web app's public API key, matching local `.env.local` |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `math-quest-2d6e5.firebaseapp.com`                                        |
| `VITE_FIREBASE_APP_ID`              | Registered Firebase web app ID, matching local `.env.local`               |

The project ID is fixed in the workflow. These are identifiers/public browser configuration, not a private key. Generated `gha-creds-*.json` authentication files are ignored by Git and remain outside `dist/`. The validation job has read-only repository access; only the branch-restricted publication job can request an OIDC token. Google authentication happens after installation/build and immediately before publication.

## Activate and check

1. Finish the one-time connection above.
2. Commit and push the reviewed application/workflow changes to the release branch through the normal Git workflow. Local edits alone do not trigger Actions.
3. Inspect the first run: validation, cloud build, authentication, Hosting publication and hosted-file verification must all succeed.
4. Open `https://math-quest-2d6e5.web.app` and check sign-in and the 3D interface on an actual family device.

The workflow fails with named missing variables until configuration is complete. No remote workflow execution, IAM setup or deployment has been performed as part of this local workflow change.

References: [Google authentication action](https://github.com/google-github-actions/auth), [Firebase CLI CI authentication](https://firebase.google.com/docs/cli#cli-ci-systems), [Hosting roles and API Keys Viewer requirement](https://firebase.google.com/docs/projects/iam/roles-predefined-product#firebase-hosting-roles).
