import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Project from "./models/Project.js";
import Bug from "./models/Bug.js";
import Comment from "./models/Comment.js";
import ActivityLog from "./models/ActivityLog.js";
import Notification from "./models/Notification.js";
import Sprint from "./models/Sprint.js";

dotenv.config();

const run = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Bug.deleteMany({}),
    Comment.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
    Sprint.deleteMany({}),
  ]);

  console.log("Creating users...");
  const admin = await User.create({ name: "Admin User", email: "admin@bugtracker.dev", password: "password123", role: "admin" });
  const dev1 = await User.create({ name: "Aditi Sharma", email: "aditi@bugtracker.dev", password: "password123", role: "developer" });
  const dev2 = await User.create({ name: "Rohan Mehta", email: "rohan@bugtracker.dev", password: "password123", role: "developer" });
  const tester1 = await User.create({ name: "Kavya Nair", email: "kavya@bugtracker.dev", password: "password123", role: "tester" });
  const reporter1 = await User.create({ name: "Sam Patel", email: "sam@bugtracker.dev", password: "password123", role: "reporter" });

  console.log("Creating projects...");
  const proj1 = await Project.create({
    name: "AssetFlow Platform",
    key: "AF",
    description: "Core asset management web application for enterprise asset tracking and inventory management.",
    lead: dev1._id,
    members: [admin._id, dev1._id, dev2._id, tester1._id, reporter1._id],
    bugSequence: 5,
  });

  const proj2 = await Project.create({
    name: "Mobile App",
    key: "MOB",
    description: "React Native companion app for the AssetFlow platform with offline-first architecture.",
    lead: dev2._id,
    members: [admin._id, dev2._id, tester1._id],
    bugSequence: 3,
  });

  console.log("Creating sprints...");
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

  const sprint1 = await Sprint.create({
    name: "Sprint 1 - Auth & Core",
    project: proj1._id,
    description: "Authentication module fixes and core platform stability",
    startDate: now,
    endDate: twoWeeksLater,
    status: "active",
    createdBy: admin._id,
  });

  const sprint2 = await Sprint.create({
    name: "Sprint 2 - Mobile Fixes",
    project: proj2._id,
    description: "Critical mobile app bug fixes for Android and iOS",
    startDate: now,
    endDate: fourWeeksLater,
    status: "planning",
    createdBy: admin._id,
  });

  console.log("Creating bugs...");
  const dueInFive = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const dueInTen = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const overdue = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const bugsData = [
    {
      bugId: "AF-1", title: "Login fails with 500 error on invalid password",
      description: "Server throws unhandled exception instead of returning 401 when bcrypt compare rejects.",
      stepsToReproduce: "1. Go to /login\n2. Enter valid email\n3. Enter incorrect password\n4. Click Login",
      expectedResult: "Should display 'Invalid email or password' error message",
      actualResult: "Page shows 500 Internal Server Error and the server crashes",
      project: proj1._id, reportedBy: tester1._id, assignedTo: dev1._id,
      status: "in_progress", priority: "high", severity: "major",
      labels: ["auth", "backend"], dueDate: dueInFive,
      watchers: [tester1._id, dev1._id, admin._id],
    },
    {
      bugId: "AF-2", title: "Dashboard chart overflows on mobile viewport",
      description: "Chart.js canvas breaks layout below 375px width, causing horizontal scroll.",
      stepsToReproduce: "1. Open dashboard on mobile (375px or smaller)\n2. Scroll to charts section",
      expectedResult: "Charts should resize responsively within container",
      actualResult: "Charts overflow container and cause horizontal scroll on entire page",
      project: proj1._id, reportedBy: reporter1._id, assignedTo: dev2._id,
      status: "open", priority: "medium", severity: "minor",
      labels: ["ui", "responsive"], dueDate: dueInTen,
      watchers: [reporter1._id, dev2._id],
    },
    {
      bugId: "AF-3", title: "Duplicate bug entries created on double-submit",
      description: "Clicking submit twice quickly creates two identical bug records due to missing debounce.",
      stepsToReproduce: "1. Open create bug modal\n2. Fill in required fields\n3. Double-click the submit button quickly",
      expectedResult: "Only one bug should be created",
      actualResult: "Two identical bugs are created in the database",
      project: proj1._id, reportedBy: tester1._id, assignedTo: dev1._id,
      status: "in_review", priority: "critical", severity: "major",
      labels: ["backend", "data-integrity"],
      watchers: [tester1._id, dev1._id],
    },
    {
      bugId: "AF-4", title: "CSV export missing severity column",
      description: "Recently added severity field not included in the export utility output.",
      project: proj1._id, reportedBy: reporter1._id, assignedTo: null,
      status: "open", priority: "low", severity: "minor",
      labels: ["export"],
      watchers: [reporter1._id],
    },
    {
      bugId: "AF-5", title: "Session expires prematurely after 5 minutes",
      description: "JWT expiry misconfigured, should be 7 days per env config but actual token lifetime is only 5 minutes.",
      expectedResult: "User sessions should last 7 days as configured",
      actualResult: "Sessions expire after approximately 5 minutes",
      project: proj1._id, reportedBy: dev2._id, assignedTo: dev1._id,
      status: "resolved", priority: "high", severity: "major",
      labels: ["auth"], resolvedAt: new Date(),
      watchers: [dev2._id, dev1._id],
    },
    {
      bugId: "MOB-1", title: "Push notifications not received on Android 14",
      description: "FCM token registration fails silently on newer Android 14+ devices due to SDK compatibility.",
      stepsToReproduce: "1. Install app on Android 14 device\n2. Grant notification permission\n3. Trigger a notification from backend\n4. Wait for notification",
      expectedResult: "Push notification should appear in notification tray",
      actualResult: "No notification received. FCM token registration fails silently in logcat",
      project: proj2._id, reportedBy: tester1._id, assignedTo: dev2._id,
      status: "open", priority: "high", severity: "major",
      labels: ["android", "notifications"], dueDate: overdue,
      watchers: [tester1._id, dev2._id],
    },
    {
      bugId: "MOB-2", title: "App crashes when opening bug detail with no comments",
      description: "Null reference error when comments array is empty on the bug detail screen.",
      stepsToReproduce: "1. Navigate to a bug that has no comments\n2. Open bug detail view",
      expectedResult: "Bug detail page should load with an empty comments section",
      actualResult: "App crashes with NullPointerException in CommentList component",
      project: proj2._id, reportedBy: tester1._id, assignedTo: dev2._id,
      status: "closed", priority: "critical", severity: "blocker",
      labels: ["crash"], closedAt: new Date(),
      watchers: [tester1._id, dev2._id],
    },
    {
      bugId: "MOB-3", title: "Dark mode toggle does not persist after app restart",
      description: "Theme preference stored in memory only, not AsyncStorage, so it resets on restart.",
      expectedResult: "Dark mode preference should persist across app restarts",
      actualResult: "App always starts in light mode regardless of previous setting",
      project: proj2._id, reportedBy: reporter1._id, assignedTo: null,
      status: "reopened", priority: "low", severity: "minor",
      labels: ["ui", "settings"],
      watchers: [reporter1._id],
    },
  ];

  const bugs = await Bug.insertMany(bugsData);

  // Add bugs to sprints
  sprint1.bugs = [bugs[0]._id, bugs[2]._id, bugs[4]._id];
  await sprint1.save();
  sprint2.bugs = [bugs[5]._id, bugs[6]._id];
  await sprint2.save();

  // Update sprint references on bugs
  await Bug.updateMany({ _id: { $in: [bugs[0]._id, bugs[2]._id, bugs[4]._id] } }, { sprint: sprint1._id });
  await Bug.updateMany({ _id: { $in: [bugs[5]._id, bugs[6]._id] } }, { sprint: sprint2._id });

  console.log("Creating activity logs...");
  for (const bug of bugs) {
    await ActivityLog.create({
      bug: bug._id, actor: bug.reportedBy, action: "created",
      toValue: "open", meta: `Bug ${bug.bugId} created`,
    });
    if (bug.assignedTo) {
      await ActivityLog.create({
        bug: bug._id, actor: admin._id, action: "assigned",
        toValue: bug.assignedTo.toString(), meta: `Assigned`,
      });
    }
    if (bug.status !== "open") {
      await ActivityLog.create({
        bug: bug._id, actor: bug.assignedTo || bug.reportedBy,
        action: bug.status === "closed" ? "closed" : bug.status === "reopened" ? "reopened" : "status_changed",
        fromValue: "open", toValue: bug.status,
      });
    }
  }

  console.log("Creating comments...");
  await Comment.create({ bug: bugs[0]._id, author: dev1._id, text: "Reproduced locally. Root cause is the auth middleware not catching bcrypt compare rejection. The promise rejection propagates uncaught to the error handler which sends 500." });
  await Comment.create({ bug: bugs[0]._id, author: tester1._id, text: "Confirmed also happens on staging environment. Marking high priority." });
  await Comment.create({ bug: bugs[2]._id, author: dev1._id, text: "Adding a debounce + idempotency key on the create endpoint. PR #47 is up for review." });
  await Comment.create({ bug: bugs[5]._id, author: dev2._id, text: "Looks like it is scoped to Android 14 only. FCM SDK needs a version bump to 23.4.0+." });
  await Comment.create({ bug: bugs[7]._id, author: reporter1._id, text: "This was marked as resolved before but the fix didn't hold. The AsyncStorage key is being overwritten by the default config on startup." });

  // Log comment activities
  await ActivityLog.create({ bug: bugs[0]._id, actor: dev1._id, action: "commented", meta: "Reproduced locally. Root cause is the auth middleware..." });
  await ActivityLog.create({ bug: bugs[0]._id, actor: tester1._id, action: "commented", meta: "Confirmed also happens on staging environment." });
  await ActivityLog.create({ bug: bugs[2]._id, actor: dev1._id, action: "commented", meta: "Adding a debounce + idempotency key on the create endpoint." });

  console.log("Creating sample notifications...");
  await Notification.insertMany([
    {
      recipient: dev1._id, type: "bug_assigned", title: "Bug assigned to you",
      message: "AF-1: Login fails with 500 error on invalid password",
      bug: bugs[0]._id, project: proj1._id, actor: admin._id,
    },
    {
      recipient: dev2._id, type: "bug_assigned", title: "Bug assigned to you",
      message: "MOB-1: Push notifications not received on Android 14",
      bug: bugs[5]._id, project: proj2._id, actor: admin._id,
    },
    {
      recipient: tester1._id, type: "bug_status_changed", title: "Bug status changed",
      message: "AF-1 moved from open to in_progress",
      bug: bugs[0]._id, project: proj1._id, actor: dev1._id,
    },
    {
      recipient: dev1._id, type: "bug_commented", title: "New comment",
      message: "Kavya Nair commented on AF-1: Confirmed also happens on staging...",
      bug: bugs[0]._id, project: proj1._id, actor: tester1._id,
    },
  ]);

  console.log("\n✅ Seed complete.");
  console.log("\nDemo login credentials (all passwords: password123):");
  console.log("  Admin:     admin@bugtracker.dev");
  console.log("  Developer: aditi@bugtracker.dev / rohan@bugtracker.dev");
  console.log("  Tester:    kavya@bugtracker.dev");
  console.log("  Reporter:  sam@bugtracker.dev");
  console.log("\nProjects: AssetFlow Platform (AF), Mobile App (MOB)");
  console.log("Sprints:  Sprint 1 - Auth & Core, Sprint 2 - Mobile Fixes");
  console.log(`Bugs:     ${bugs.length} seeded across projects`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
