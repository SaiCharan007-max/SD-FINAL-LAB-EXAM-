const getExamStatus = (startDatetime, durationMinutes) => {
  const now = new Date();
  const start = new Date(startDatetime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  if (now < start) {
    return 'Upcoming';
  }

  if (now >= start && now <= end) {
    return 'Ongoing';
  }

  return 'Completed';
};

export { getExamStatus };
