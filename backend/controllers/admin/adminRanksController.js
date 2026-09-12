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
    const {
      level,
      name,
      ownDeposit,
      totalClientDeposit,
      minInvest,
      reward,
      condition,
      companyProfitSharing,
      downlineStructureRequired,
      desc,
      badge
    } = req.body;

    if (!name || reward === undefined) {
      return res.status(400).json({
        success: false,
        message: "Rank name and cash reward are required.",
      });
    }

    const rankLevel = Number(level) || (await Rank.countDocuments()) + 1;
    const clientDepositVal = totalClientDeposit !== undefined ? Number(totalClientDeposit) : (minInvest !== undefined ? Number(minInvest) : 0);

    const newRank = await Rank.create({
      level: rankLevel,
      name: name.trim(),
      ownDeposit: ownDeposit !== undefined ? Number(ownDeposit) : 0,
      totalClientDeposit: clientDepositVal,
      minInvest: clientDepositVal,
      reward: Number(reward),
      condition: condition || "1 Leg should not be more than 40% of the GV",
      companyProfitSharing: companyProfitSharing !== undefined ? String(companyProfitSharing) : "0",
      downlineStructureRequired: downlineStructureRequired || "",
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
    let rank;
    const { id } = req.params;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      rank = await Rank.findById(id);
    } else if (!isNaN(Number(id))) {
      rank = await Rank.findOne({ level: Number(id) });
    }

    if (!rank) {
      return res.status(404).json({ success: false, message: "Rank tier not found." });
    }

    const {
      name,
      ownDeposit,
      totalClientDeposit,
      minInvest,
      reward,
      condition,
      companyProfitSharing,
      downlineStructureRequired,
      desc,
      badge,
      status
    } = req.body;

    if (name !== undefined) rank.name = name.trim();
    if (ownDeposit !== undefined) rank.ownDeposit = Number(ownDeposit);
    if (totalClientDeposit !== undefined) {
      rank.totalClientDeposit = Number(totalClientDeposit);
      rank.minInvest = Number(totalClientDeposit);
    } else if (minInvest !== undefined) {
      rank.minInvest = Number(minInvest);
      rank.totalClientDeposit = Number(minInvest);
    }
    if (reward !== undefined) rank.reward = Number(reward);
    if (condition !== undefined) rank.condition = condition;
    if (companyProfitSharing !== undefined) rank.companyProfitSharing = String(companyProfitSharing);
    if (downlineStructureRequired !== undefined) rank.downlineStructureRequired = downlineStructureRequired;
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

// @desc    Bulk Update Ranks
// @route   PUT /api/admin/ranks/bulk
exports.bulkUpdateRanks = async (req, res) => {
  try {
    const { ranks } = req.body;
    if (!Array.isArray(ranks)) {
      return res.status(400).json({ success: false, message: "Invalid ranks data array." });
    }

    const updatedRanks = [];
    for (const r of ranks) {
      const clientDepositVal = r.totalClientDeposit !== undefined ? Number(r.totalClientDeposit) : (r.minInvest !== undefined ? Number(r.minInvest) : 0);
      const updateData = {
        name: r.name,
        ownDeposit: r.ownDeposit !== undefined ? Number(r.ownDeposit) : 0,
        totalClientDeposit: clientDepositVal,
        minInvest: clientDepositVal,
        reward: Number(r.reward || 0),
        condition: r.condition || "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: r.companyProfitSharing !== undefined ? String(r.companyProfitSharing) : "0",
        downlineStructureRequired: r.downlineStructureRequired || "",
      };

      let rankDoc;
      if (r._id && /^[0-9a-fA-F]{24}$/.test(r._id)) {
        rankDoc = await Rank.findByIdAndUpdate(r._id, { $set: updateData }, { new: true });
      } else if (r.level !== undefined) {
        rankDoc = await Rank.findOneAndUpdate({ level: Number(r.level) }, { $set: updateData }, { new: true, upsert: true });
      }

      if (rankDoc) updatedRanks.push(rankDoc);
    }

    res.status(200).json({
      success: true,
      message: "Rank ladder updated successfully.",
      count: updatedRanks.length,
      ranks: updatedRanks,
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
