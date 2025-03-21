declare namespace chrome {
  namespace extension {
    function sendMessage(
      extensionId: string,
      message: any,
      options?: any
    ): Promise<any>;
  }
} 