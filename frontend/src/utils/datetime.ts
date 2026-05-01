//WE ARE USING UTC TIMEZONE OKAY
export const buildDateTime = (date: string, time: string) => {
  return new Date(`${date}T${time}:00`).toISOString();
};