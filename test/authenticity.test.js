const Authenticity = artifacts.require("Authenticity");

contract("Authenticity", accounts => {
  const dummyFileHash = "samplehash123";
  const dummyFileSize = 2048;
  const dummyFileExtension = ".pdf";

  it("should certify a file and store metadata correctly", async () => {
    const instance = await Authenticity.deployed();

    // Kirim transaksi untuk sertifikasi file
    const tx = await instance.certifyFile(
      dummyFileSize,
      dummyFileHash,
      dummyFileExtension,
      { from: accounts[0], value: 0 }
    );

    // Ambil hasil verifikasi
    const result = await instance.verifyFile(dummyFileHash);

    assert.equal(result[0], accounts[0], "Author address should match sender");
    assert.equal(result[1], dummyFileHash, "Hash mismatch");
    assert.equal(result[3].toNumber(), dummyFileSize, "File size mismatch");
    assert.equal(result[4], dummyFileExtension, "Extension mismatch");
  });

  it("should return empty values for unknown hash", async () => {
    const instance = await Authenticity.deployed();

    const result = await instance.verifyFile("unknownhash");

    assert.equal(result[0], "0x0000000000000000000000000000000000000000", "Author should be zero address");
  });
});
