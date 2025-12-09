export function createMockSession(userId: string) {
  return {
    user: {
      id: userId,
      email: "test@example.com",
      name: "Test User",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}
