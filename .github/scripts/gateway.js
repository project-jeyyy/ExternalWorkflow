// ── Hedgi Workflow Gateway — Google Apps Script ───────────────────────────────
// Deploy this as a Web App (Execute as: Me, Who has access: Anyone)
// Then add your GitHub token:
//   Apps Script → Project Settings → Script Properties
//   Name: GITHUB_TOKEN  Value: ghp_yourTokenHere

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');

    const title = `[UPDATE] ${data.client} — ${data.column}`;
    const body =
`**Account Owner:** ${data.owner}
**Client Name:** ${data.client}
**Column to Update:** ${data.column}
**New Status:** ${data.status}
**Issues / Flagged Transactions:** ${data.issue || '—'}
**Overall Completion:** ${data.overall || 'No change'}
**Additional Notes:** ${data.notes || '—'}`;

    UrlFetchApp.fetch('https://api.github.com/repos/project-jeyyy/ExternalWorkflow/issues', {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ title, body }),
      muteHttpExceptions: true,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Hedgi Gateway' }))
    .setMimeType(ContentService.MimeType.JSON);
}
