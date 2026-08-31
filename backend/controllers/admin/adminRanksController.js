const Rank = require("../../models/Rank");
const User = require("../../models/User");

// @desc    Get All Ranks in Ladder
// @route   GET /api/admin/ranks
exports.getAllRanks = async (req, res) => {
  try {
    const ranks = await Rank.find().sort({ level: 1 });
    res.status(200).json({ success: true, count: ranks.length, ranks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Custom Rank
// @route   POST /api/admin/ranks
exports.createRank = async (req, res) => {
  try {
    const { level, name, minInvest, reward, desc, badge } = req.body;

    if (!name || minInvest === undefined || reward === undefined) {
      return res.status(400).json({
        success: false,
        message: "Rank name, minimum turnover (minInvest), and cash reward are required.",
      });
    }

    const rankLevel = Number(level) || (await Rank.countDocuments()) + 1;

    const newRank = await Rank.create({
      level: rankLevel,
      name: name.trim(),
      minInvest: Number(minInvest),
      reward: Number(reward),
      desc: desc || "Leadership milestone rank tier.",
      badge: badge || "",
    });

    res.status(201).json({
      success: true,
      message: "Rank created successfully.",
      rank: newRank,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Rank (Turnover requirement, Cash Reward, Details)
// @route   PUT /api/admin/ranks/:id
exports.updateRank = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id);
    if (!rank) {
      return res.status(404).json({ success: false, message: "Rank tier not found." });
    }

    const { name, minInvest, reward, desc, badge, status } = req.body;

    if (name !== undefined) rank.name = name;
    if (minInvest !== undefined) rank.minInvest = Number(minInvest);
    if (reward !== undefined) rank.reward = Number(reward);
    if (desc !== undefined) rank.desc = desc;
    if (badge !== undefined) rank.badge = badge;
    if (status !== undefined) rank.status = status;

    await rank.save();

    res.status(200).json({
      success: true,
      message: `${rank.name} updated successfully.`,
      rank,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Rank
// @route   DELETE /api/admin/ranks/:id
exports.deleteRank = async (req, res) => {
  try {
    const rank = await Rank.findByIdAndDelete(req.params.id);
    if (!rank) {
      return res.status(404).json({ success: false, message: "Rank tier not found." });
    }
    res.status(200).json({
      success: true,
      message: "Rank tier deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Global Achievers Leaderboard
// @route   GET /api/admin/ranks/leaderboard
exports.getAchieversLeaderboard = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ teamTurnover: -1, rankLevel: -1 });

    const leaderboard = users.map((u) => ({
      id: u._id,
      customId: u.customId || "HORIZON-USR-01",
      name: u.name,
      email: u.email,
      phone: u.phone,
      rank: u.currentRank || "Starter",
      level: u.rankLevel || 1,
      directRefs: u.directReferrals || 0,
      turnover: u.teamTurnover || 0,
      reward: u.totalProfit || 0,
      sponsor: u.sponsorId || "HORIZON-HQ",
      status: u.status,
    }));

    res.status(200).json({ success: true, count: leaderboard.length, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
