const responseBuilder = (
  status,
  message,
  data = {},
  accessToken = undefined
) => {
  return {
    status: status,
    payload: {
      message: message,
      data: {
        data: data,
        accessToken: accessToken,
      },
    },
  };
};

export default responseBuilder;
