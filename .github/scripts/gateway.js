// ── Hedgi Workflow Gateway — Google Apps Script ───────────────────────────────
// Deploy this as a Web App (Execute as: Me, Who has access: Anyone)
// Then add your GitHub token:
//   Apps Script → Project Settings → Script Properties
//   Name: GITHUB_TOKEN  Value: ghp_yourTokenHere

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');

    if (!token) {
      Logger.log('ERROR: GITHUB_TOKEN not found in Script Properties');
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Token not configured' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const title = `[UPDATE] ${data.client} — ${data.column}`;
    const body =
`**Account Owner:** ${data.owner}
**Client Name:** ${data.client}
**Column to Update:** ${data.column}
**New Status:** ${data.status}
**Issues / Flagged Transactions:** ${data.issue || '—'}
**Overall Completion:** ${data.overall || 'No change'}
**Additional Notes:** ${data.notes || '—'}`;

    const response = UrlFetchApp.fetch('https://api.github.com/repos/project-jeyyy/ExternalWorkflow/issues', {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ title, body }),
      muteHttpExceptions: true,
    });

    const status = response.getResponseCode();
    const responseText = response.getContentText();
    Logger.log(`GitHub API response: ${status} — ${responseText}`);

    if (status === 201) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: `GitHub returned ${status}: ${responseText}` }))
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    Logger.log(`ERROR: ${err.message}`);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Health check
function doGet() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'Hedgi Gateway', tokenSet: !!token }))
    .setMimeType(ContentService.MimeType.JSON);
}
