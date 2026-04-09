const formatSecondsToMMSS = (seconds) => {
  const totalSeconds = Number(seconds) || 0;
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const remainingSeconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const escapeCsvValue = (value) => {
  const stringValue = value === null || value === undefined ? '' : String(value);
  const escapedValue = stringValue.replace(/"/g, '""');
  return `"${escapedValue}"`;
};

const generateLeaderboardCSV = (rows) => {
  const header = [
    'Rank',
    'Full Name',
    'Username',
    'Score',
    'Total Questions',
    'Percentage',
    'Time Taken (MM:SS)',
    'Submitted At'
  ];

  const body = rows.map((row) => [
    row.rank,
    row.full_name,
    row.username,
    row.score,
    row.num_questions,
    row.percentage,
    formatSecondsToMMSS(row.time_taken_sec),
    row.submitted_at ? new Date(row.submitted_at).toISOString() : ''
  ]);

  return [header, ...body]
    .map((line) => line.map(escapeCsvValue).join(','))
    .join('\n');
};

export { generateLeaderboardCSV, formatSecondsToMMSS };
