-- Secret Santa: tjat om en önskelista (MUPP-071). Hör till den som tjatas på (mottagaren), inte till givaren. nag_requested_at: när
-- givaren tryckte på knappen och mejlet väntar på jobbet (millisekunder, NULL = inget väntar). nag_mailed_at: när tjat-mejlet senast
-- skickades; knappen är låst en timme efter det.
ALTER TABLE ss_member ADD COLUMN nag_requested_at INTEGER;
ALTER TABLE ss_member ADD COLUMN nag_mailed_at INTEGER;
