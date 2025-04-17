#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get the commit message file path from the first argument
const commitMsgFile = process.argv[2];
const commitMsg = fs.readFileSync(commitMsgFile, "utf8");

// Process the commit message:
// 1. Trim spaces
// 2. Remove dots from the end
// 3. Capitalize the first letter
function formatCommitMessage(message) {
  // Skip empty messages or comments
  if (!message || message.startsWith("#")) {
    return message;
  }

  // Trim spaces
  let formatted = message.trim();

  // Remove dots from the end
  formatted = formatted.replace(/\.+$/, "");

  // Capitalize the first letter
  if (formatted.length > 0) {
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return formatted;
}

// Handle multi-line commit messages
const lines = commitMsg.split("\n");
const formattedLines = lines.map((line, index) => {
  // Only format the first line or lines that don't start with #
  if (index === 0 || !line.startsWith("#")) {
    return formatCommitMessage(line);
  }
  return line;
});

const formattedCommitMsg = formattedLines.join("\n");

// Write the formatted message back to the commit message file
fs.writeFileSync(commitMsgFile, formattedCommitMsg);
