use anchor_lang::prelude::*;
use spl_discriminator::discriminator::SplDiscriminate;

declare_id!("HWNpieZscUsPMR2RjnHBPy8Crp4ziy67gNzGKWuGmXeW");

pub const CANCELLATION_INSUFFICIENT_AMOUNT: i8 = 1;
pub const CANCELLATION_DELEGATION_REVOKED: i8 = 2;
pub const CANCELLATION_DELEGATED_AMOUNT_NOT_ENOUGH: i8 = 3;

pub const MAXIMUM_SUBSCRIPTIONS_PER_PLAN: usize = 10;
pub const MAXIMUM_SUBSCRIPTIONS_PER_USER: usize = 20;
pub const MAXIMUM_SUBSCRIPTION_PLAN_PER_AUTHOR: usize = 10;
pub const MAXIMUM_SUBSCRIPTION_PLANS: usize = 100;
pub const MAXIMUM_NODES: usize = 50;

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
pub const MAXIMUM_CREATOR_ACCOUNTS: usize = 50;
pub const MAXIMUM_POSTS_PER_CREATOR: usize = 30;

#[program]
pub mod solcast {
    use super::*;
}

#[derive(Accounts)]
pub struct CloseSubscriptionPlan<'info> {
    #[account(
        seeds = [b"subscription_plan_author", authority.key().as_ref()],
        has_one = authority @ErrorCode::SubscriptionPlanUnauthorizedToClose,
        bump = subscription_plan_author.bump,
    )]
    pub subscription_plan_author: Box<Account<'info, SubscriptionPlanAuthor>>,

    #[account(
        mut,
        has_one = subscription_plan_author @ErrorCode::SubscriptionPlanUnauthorizedToClose,
        constraint = subscription_plan.has_already_been_initialized @ ErrorCode::SubscriptionPlanNotInitialized,
        constraint = subscription_plan.is_active @ ErrorCode::SubscriptionPlanAlreadyClosed
    )]
    pub subscription_plan: Box<Account<'info, SubscriptionPlan>>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(title: String, content_data: String)]
pub struct CreatePost<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        seeds = [b"post", creator.key().as_ref(), (creator.last_post_index + 1).to_string().as_ref()],
        bump,
        space= ANCHOR_DISCRIMINATOR_SIZE + CreatePost::INIT_SPACE
    )]
    pub post: Box<Account<'info, CreatorPost>>,

    #[account(
        mut,
        seeds = [b"creator", authority.key().as_ref()],
        bump = creator.bump,
        has_one = authority,
        constraint = creator.has_already_been_initialized @CreatorNotInitialized
    )]
    pub creator: Box<Account<'info, Creator>>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(plan_name: String)]
pub struct CreateSubscriptionPlan<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump,
        constraint = protocol_state.has_already_been_initialized
    )]
    pub protocol_state: Box<Account<'info, Protocol>>,

    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"subscription_plan_author", authority.key().as_ref()],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + SubscriptionPlanAuthor::INIT_SPACE,
    )]
    pub subscription_plan_author: Box<Account<'info, SubscriptionPlanAuthor>>,

    #[account(
        init,
        payer = authority,
        seeds = [b"subscription_plan", plan_name.as_bytes(), subscription_plan_author.key().as_ref()],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + SubscriptionPlan::INIT_SPACE,
    )]
    pub subscription_plan: Box<Account<'info, SubscriptionPlan>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub subscription_plan_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(address = mint::USDC @ ErrorCode::InvalidMint)]
    pub mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
#[instruction(creator_name: String, creator_amount: i64, creator_data_id: String)]
pub struct InitializeCreator<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"creator", authority.key().as_ref()],
        bump,
        space= ANCHOR_DISCRIMINATOR_SIZE + Creator::INIT_SPACE
    )]
    pub creator: Box<Account<'info, Creator>>,

    #[account( 
        mut, 
        seeds = [b"grantive_state"],
        bump = grantive_state.bump,
        constraint = grantive_state.has_already_been_initialized
    )]
    pub grantive_state: Box<Account<'info, Grantive>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub creator_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub protocol_state: Box<Account<'info, Protocol>>,

    #[account(mut)]
    /// CHECK is checked on CPI call to elfo protocol
    pub subscription_plan: UncheckedAccount<'info>,

    #[account(mut)]
   /// CHECK is checked on CPI call to elfo protocol
    pub subscription_plan_author: UncheckedAccount<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    // #[account(address = mint::USDC @ ErrorCode::InvalidMint)]
    pub mint: Box<Account<'info, Mint>>,
    
    pub protocol: Program<'info, Protocol>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"protocol_signer"],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + ProtocolSigner::INIT_SPACE
    )]
    pub protocol_signer: Box<Account<'info, ProtocolSigner>>,

    #[account(
        init,
        payer = authority,
        seeds = [b"protocol_state"],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + ProtocolSigner::INIT_SPACE
    )]
    pub protocol_state: Box<Account<'info, Protocol>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"grantive_state"],
        bump,
        space= ANCHOR_DISCRIMINATOR_SIZE + Grantive::INIT_SPACE
    )]
    pub grantive_state: Box<Account<'info, Grantive>>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct RegisterNode<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"node", authority.key().as_ref()],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + Node::INIT_SPACE,
    )]
    pub node: Box<Account<'info, Node>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = node_payment_wallet,
    )]
    pub node_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"protocol_state"],
        bump = protocol_state.bump,
        constraint = protocol_state.has_already_been_initialized
    )]
    pub protocol_state: Box<Account<'info, Protocol>>,
    /// CHECK: This account will not be checked by anchor
    pub node_payment_wallet: UncheckedAccount<'info>,

    // #[account(address = mint::USDC @ ErrorCode::InvalidMint)] // remove on testing
    pub mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
pub struct Subscribe<'info> {
    #[account(mut)]
    pub who_subscribes: Signer<'info>,

    #[account(
        mut,
        seeds = [b"protocol_signer"],
        bump = protocol_signer.bump,
    )]
    pub protocol_signer: Box<Account<'info, ProtocolSigner>>,

    #[account(
        init_if_needed,
        payer = who_subscribes,
        seeds = [b"subscription", subscriber.key().as_ref(), subscription_plan.key().as_ref()],
        bump,
        space= ANCHOR_DISCRIMINATOR_SIZE + Subscription::INIT_SPACE,
    )]
    pub subscription: Box<Account<'info, Subscription>>,

    #[account(
        init_if_needed,
        payer = who_subscribes,
        seeds = [b"state", who_subscribes.key().as_ref()],
        bump,
        space= ANCHOR_DISCRIMINATOR_SIZE + Subscriber::INIT_SPACE,
    )]
    pub subscriber: Box<Account<'info, Subscriber>>,

    #[account(
        init_if_needed,
        payer = who_subscribes,
        associated_token::mint = mint,
        associated_token::authority = who_subscribes,
    )]
    pub subscriber_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        constraint = subscription_plan.has_already_been_initialized @ ErrorCode::SubscriptionPlanNotInitialized,
        constraint = subscription_plan.is_active @ ErrorCode::SubscriptionPlanInactive,
        has_one = subscription_plan_payment_account @ErrorCode::SubscriptionPlanInvalidPaymentAccount
    )]
    pub subscription_plan: Box<Account<'info, SubscriptionPlan>>,

    #[account(
        mut,
        constraint = subscription_plan_payment_account.mint ==  mint.key() @ ErrorCode::InvalidMint
    )]
    pub subscription_plan_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(address = mint::USDC @ ErrorCode::InvalidMint)]
    pub mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub clock: Sysvar<'info, Clock>,
}


#[derive(Accounts)]
pub struct TriggerPayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = subscriber_payment_account.mint ==  mint.key() @ ErrorCode::InvalidMint
    )]
    pub subscriber_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"protocol_signer"],
        bump = protocol_signer.bump
    )]
    pub protocol_signer: Box<Account<'info, ProtocolSigner>>,

    #[account(
        mut,
        has_one = subscription_plan,
        has_one = subscriber,
        constraint = subscription.has_already_been_initialized @ErrorCode::SubscriberNotInitialized,
        constraint = subscription.is_active @ ErrorCode::SubscriptionNotSubscribed,
    )]
    pub subscription: Box<Account<'info, Subscription>>,

    #[account(
        constraint = subscriber.has_already_been_initialized @ ErrorCode::SubscriberNotInitialized,
        has_one = subscriber_payment_account
    )]
    pub subscriber: Box<Account<'info, Subscriber>>,

    #[account(
        mut,
        constraint = subscription_plan_payment_account.mint ==  mint.key() @ ErrorCode::InvalidMint
    )]
    pub subscription_plan_payment_account: Box<Account<'info, TokenAccount>>,

    #[account(
        constraint = subscription_plan.has_already_been_initialized @ErrorCode::SubscriptionPlanNotInitialized,
        constraint = subscription_plan.is_active @ ErrorCode::SubscriptionPlanInactive,
        has_one = subscription_plan_payment_account
    )]
    pub subscription_plan: Box<Account<'info, SubscriptionPlan>>,

    #[account(
        seeds = [b"node", authority.key().as_ref()],
        bump = node.bump,
        has_one = authority,
        has_one = node_payment_account,
        has_one = node_payment_wallet,
        constraint = node.is_registered @ErrorCode::NodeNotRegistered
    )]
    pub node: Box<Account<'info, Node>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = node_payment_wallet,
    )]
    pub node_payment_account: Box<Account<'info, TokenAccount>>,

    pub node_payment_wallet: UncheckedAccount<'info>,

    // #[account(address = mint::USDC @ ErrorCode::InvalidMint)]
    pub mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}


#[derive(Accounts)]
pub struct Unsubscribe<'info> {
    #[account(mut)]
    pub who_subscribes: Signer<'info>,

    #[account(
        mut,
        seeds = [b"subscription", subscriber.key().as_ref(), subscription_plan.key().as_ref()],
        bump = subscription.bump,
        has_one = subscriber,
        has_one = subscription_plan,
        constraint = subscription.has_already_been_initialized @ ErrorCode::SubscriptionNotInitialized,
        constraint = subscription.is_active @ ErrorCode::SubscriptionNotSubscribed,
    )]
    pub subscription: Box<Account<'info, Subscription>>,

    #[account(
        mut,
        seeds = [b"state", who_subscribes.key().as_ref()],
        bump = subscriber.bump,
        constraint = subscriber.has_already_been_initialized @ ErrorCode::SubscriberNotInitialized,
    )]
    pub subscriber: Box<Account<'info, Subscriber>>,

    #[account(
        mut,
        constraint = subscription_plan.has_already_been_initialized @ ErrorCode::SubscriptionPlanNotInitialized,
    )]
    pub subscription_plan: Box<Account<'info, SubscriptionPlan>>,
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Subscriber {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub authority: Pubkey,
    pub subscriber_payment_account: Pubkey,
    pub subscription_accounts: [Pubkey; MAXIMUM_SUBSCRIPTIONS_PER_USER],
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Subscription {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub subscriber: Pubkey,
    pub subscription_plan: Pubkey,
    pub is_active: bool,
    pub is_cancelled: bool,
    pub cancellation_reason: i8,

    pub last_payment_timestamp: i64,
    pub next_payment_timestamp: i64,
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct SubscriptionPlan {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    #[max_len(100)]
    pub plan_name: String,
    pub subscription_plan_author: Pubkey,
    pub subscription_plan_payment_account: Pubkey,
    pub amount: i64,
    pub frequency: i64,
    pub is_active: bool,
    pub fee_percentage: i8,
    pub subscription_accounts: [Pubkey; MAXIMUM_SUBSCRIPTIONS_PER_PLAN],
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct SubscriptionPlanAuthor {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub authority: Pubkey,
    pub subscription_plan_accounts: [Pubkey; MAXIMUM_SUBSCRIPTION_PLAN_PER_AUTHOR],
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Protocol {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub authority: Pubkey,
    pub subscription_plan_accounts: [Pubkey; MAXIMUM_SUBSCRIPTION_PLANS],
    pub registered_nodes: [Pubkey; MAXIMUM_NODES],
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct ProtocolSigner {
    pub bump: u8,
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Node {
    pub bump: u8,
    pub is_registered: bool,
    pub authority: Pubkey,
    pub node_payment_wallet: Pubkey,
    pub node_payment_account: Pubkey,
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Grantive {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub authority: Pubkey,

    pub creator_accounts: [Pubkey; MAXIMUM_CREATOR_ACCOUNTS],
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct Creator {
    pub bump: u8,
    pub has_already_been_initialized: bool,
    pub authority: Pubkey,
    #[max_len(100)]
    pub name: String,
    #[max_len(100)]
    pub data_id: String,
    pub subscription_plan: Pubkey,

    pub posts: [Pubkey; MAXIMUM_POSTS_PER_CREATOR],
    pub last_post_index: i64,
}

#[account]
#[derive(InitSpace, SplDiscriminate)]
pub struct CreatorPost {
    pub bump: u8,
    pub index: i64,
    pub has_already_been_initialized: bool,
    pub creator: Pubkey,
    #[max_len(100)]
    pub title: String,
    #[max_len(256)]
    pub content_data: String,
    pub published_on: i64,
    pub subscriber_only: bool,
}

#[error_code]
pub enum ErrorCode {
    // subscriber errors ----
    #[msg("Subscriber is not initialized.")]
    SubscriberNotInitialized,

    #[msg("Invalid State account")]
    SubsscriberInvalidStateAccount,

    // subscription errors ----
    #[msg("Subscription is not initialized.")]
    SubscriptionNotInitialized,

    #[msg("Creator Not initialized.")]
    CreatorNotInitialized,

    #[msg("User is already subscribed to the plan.")]
    SubscriptionAlreadySubscribed,

    #[msg("User is not subscribed to the plan.")]
    SubscriptionNotSubscribed,

    #[msg("Not enough funds in protocol wallet to subscribe.")]
    SubscriptionNotEnoughFunds,

    #[msg("Next payment timestamp not reached. Please try again later.")]
    SubscriptionNextPaymentTimestampNotReached,

    // subscription plan errors -----
    #[msg("Subscription plan is not initialized.")]
    SubscriptionPlanNotInitialized,

    #[msg("Subscription amount must be in the range of 1 - 1000 USDC.")]
    SubscriptionPlanAmountInvalid,

    #[msg("Subscription plan is inactive.")]
    SubscriptionPlanInactive,

    #[msg("Subscription plan is already closed.")]
    SubscriptionPlanAlreadyClosed,

    // note: 60 second may not be ideal
    #[msg("Subscription plan frequency must be atleast 60 seconds.")]
    SubscriptionPlanFrequencyError,

    #[msg("Unauthorized to close subscription.")]
    SubscriptionPlanUnauthorizedToClose,

    #[msg("Invalid payment account provided.")]
    SubscriptionPlanInvalidPaymentAccount,

    #[msg("Fee percentage must be between 1% and 5%")]
    SubscriptionPlanFeeError,

    // token error ----
    #[msg("Invalid mint.")]
    InvalidMint,

    // node error ----
    #[msg("Unauthorized to perform the action.")]
    NodeErrorUnauthorized,

    #[msg("Node not registered.")]
    NodeNotRegistered,
}
