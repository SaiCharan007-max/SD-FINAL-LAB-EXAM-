const shuffleOptions = (question) => {
  const options = [
    { text: question.option_a, original: 'A' },
    { text: question.option_b, original: 'B' },
    { text: question.option_c, original: 'C' },
    { text: question.option_d, original: 'D' }
  ];

  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }

  return options.map((option, index) => ({
    position: index + 1,
    text: option.text,
    original: option.original
  }));
};

export { shuffleOptions };
