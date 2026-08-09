/**
 * Mint short-lived JWTs signed with an SSH private key, for OpenAI-compatible
 * TTS servers using public-key JWT auth (GLM-TTS-Server: clients sign
 * {sub, exp} with their private key, the server verifies against enrolled
 * public keys - see its scripts/make_token.py, which this mirrors).
 *
 * Node's crypto reads PEM keys natively; OpenSSH-format keys
 * ("BEGIN OPENSSH PRIVATE KEY") are parsed here. Only unencrypted
 * ssh-ed25519 OpenSSH keys are supported - encrypted keys need the bcrypt
 * KDF, which is out of scope; generate a dedicated unencrypted key instead
 * (ssh-keygen -t ed25519 -f glm-tts-key).
 */
import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import fs from "node:fs";
import os from "node:os";

const readString = (buf: Buffer, off: number): [Buffer, number] => {
  const len = buf.readUInt32BE(off);
  return [buf.subarray(off + 4, off + 4 + len), off + 4 + len];
};

const loadOpenSshEd25519 = (data: Buffer, keyPath: string): KeyObject => {
  const b64 = data
    .toString("utf8")
    .replace(/-----BEGIN OPENSSH PRIVATE KEY-----/, "")
    .replace(/-----END OPENSSH PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const blob = Buffer.from(b64, "base64");
  if (blob.subarray(0, 15).toString("latin1") !== "openssh-key-v1\0") {
    throw new Error(`cannot parse private key at ${keyPath}`);
  }
  let off = 15;
  let field: Buffer;
  [field, off] = readString(blob, off);
  const cipher = field.toString("utf8");
  [field, off] = readString(blob, off);
  const kdf = field.toString("utf8");
  if (cipher !== "none" || kdf !== "none") {
    throw new Error(
      `SSH key at ${keyPath} is passphrase-protected, which is not supported - ` +
        `use a dedicated unencrypted key (ssh-keygen -t ed25519 -f glm-tts-key)`,
    );
  }
  [, off] = readString(blob, off); // kdf options (empty)
  const nkeys = blob.readUInt32BE(off);
  off += 4;
  if (nkeys !== 1) {
    throw new Error(`expected 1 key in ${keyPath}, found ${nkeys}`);
  }
  [, off] = readString(blob, off); // public key blob (re-read from the private section)
  let priv: Buffer;
  [priv, off] = readString(blob, off);

  if (priv.readUInt32BE(0) !== priv.readUInt32BE(4)) {
    throw new Error(`corrupt private key at ${keyPath} (checkint mismatch)`);
  }
  let poff = 8;
  [field, poff] = readString(priv, poff);
  const keyType = field.toString("utf8");
  if (keyType !== "ssh-ed25519") {
    throw new Error(
      `unsupported OpenSSH key type '${keyType}' at ${keyPath} (supported: ssh-ed25519; ` +
        `rsa/ec keys work in PEM format)`,
    );
  }
  let pub: Buffer, priv64: Buffer;
  [pub, poff] = readString(priv, poff);
  [priv64, poff] = readString(priv, poff);
  if (pub.length !== 32 || priv64.length !== 64) {
    throw new Error(`unexpected ed25519 key lengths in ${keyPath}`);
  }
  return createPrivateKey({
    key: {
      kty: "OKP",
      crv: "Ed25519",
      d: priv64.subarray(0, 32).toString("base64url"),
      x: pub.toString("base64url"),
    },
    format: "jwk",
  });
};

const loadSshPrivateKey = (keyPath: string): KeyObject => {
  const expanded = keyPath.replace(/^~(?=$|[/\\])/, os.homedir());
  const data = fs.readFileSync(expanded);
  if (data.includes("OPENSSH PRIVATE KEY")) {
    return loadOpenSshEd25519(data, keyPath);
  }
  // PEM (PKCS8/SEC1/PKCS1) is handled by OpenSSL; errors (bad file,
  // passphrase-required) propagate as-is
  return createPrivateKey(data);
};

/** Sign a one-hour JWT ({sub, iat, exp}) with the SSH key at keyPath. */
export const mintJwt = (keyPath: string): string => {
  const key = loadSshPrivateKey(keyPath);
  const alg =
    key.asymmetricKeyType === "ed25519"
      ? "EdDSA"
      : key.asymmetricKeyType === "rsa"
        ? "RS256"
        : undefined;
  if (!alg) {
    throw new Error(
      `unsupported key type '${key.asymmetricKeyType}' at ${keyPath} (supported: ed25519, rsa)`,
    );
  }
  const b64u = (s: string) => Buffer.from(s).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64u(JSON.stringify({ alg, typ: "JWT" }))}.${b64u(
    JSON.stringify({ sub: "tts", iat: now, exp: now + 3600 }),
  )}`;
  const signature = sign(alg === "EdDSA" ? null : "sha256", Buffer.from(unsigned), key);
  return `${unsigned}.${signature.toString("base64url")}`;
};
