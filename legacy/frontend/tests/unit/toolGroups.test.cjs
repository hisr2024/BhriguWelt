const test = require("node:test");
const assert = require("node:assert/strict");

const { toolGroups } = require("../../lib/toolGroups");

test("tool groups map into the dashboard inventory", () => {
  assert.equal(toolGroups.length, 3);

  for (const group of toolGroups) {
    assert.equal(typeof group.title, "string");
    assert.ok(group.title.length > 0);
    assert.equal(typeof group.description, "string");
    assert.ok(group.description.length > 0);
    assert.ok(Array.isArray(group.tools));
    assert.ok(group.tools.length > 0);
  }

  const tools = toolGroups.flatMap((group) => group.tools);
  assert.equal(tools.length, 13);

  const hrefs = new Set();
  for (const tool of tools) {
    assert.equal(typeof tool.name, "string");
    assert.ok(tool.name.length > 0);
    assert.equal(typeof tool.href, "string");
    assert.ok(tool.href.startsWith("/"));
    assert.equal(typeof tool.gradient, "string");
    assert.ok(tool.gradient.length > 0);
    assert.equal(typeof tool.glow, "string");
    assert.ok(tool.glow.length > 0);
    assert.ok(typeof tool.logo === "string" || typeof tool.logo === "number");
    hrefs.add(tool.href);
  }

  assert.equal(hrefs.size, tools.length);
});
