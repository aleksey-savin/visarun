import { channelJoinTrpcRoute } from './channelJoin.js';
import { channelLeaveTrpcRoute } from './channelLeave.js';
import { channelBlockTrpcRoute } from './channelBlock.js';
import { channelUnblockTrpcRoute } from './channelUnblock.js';
import { channelDeleteTrpcRoute } from './channelDelete.js';
import { getAllTelegramChannelsTrpcRoute } from './getAll.js';
import { getTelegramChannelTrpcRoute } from './getOne.js';

export const telegramRoute = {
  channelJoin: channelJoinTrpcRoute,
  channelLeave: channelLeaveTrpcRoute,
  channelBlock: channelBlockTrpcRoute,
  channelUnblock: channelUnblockTrpcRoute,
  channelDelete: channelDeleteTrpcRoute,
  getAll: getAllTelegramChannelsTrpcRoute,
  getOne: getTelegramChannelTrpcRoute,
};
