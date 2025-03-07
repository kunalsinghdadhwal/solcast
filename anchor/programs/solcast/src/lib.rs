#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod solcast {
    use super::*;

  pub fn close(_ctx: Context<CloseSolcast>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.solcast.count = ctx.accounts.solcast.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.solcast.count = ctx.accounts.solcast.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeSolcast>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.solcast.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeSolcast<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Solcast::INIT_SPACE,
  payer = payer
  )]
  pub solcast: Account<'info, Solcast>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseSolcast<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub solcast: Account<'info, Solcast>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub solcast: Account<'info, Solcast>,
}

#[account]
#[derive(InitSpace)]
pub struct Solcast {
  count: u8,
}
