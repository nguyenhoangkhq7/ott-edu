package fit.iuh.config.security;

/**
 * Local copy of AccountStatus enum, scoped to assignment-service's security package.
 * Must stay in sync with core-service AccountStatus values.
 */
public enum LocalAccountStatus {
    AVAILABLE,
    BUSY,
    DO_NOT_DISTURB,
    BE_RIGHT_BACK,
    APPEAR_OFFLINE,
    APPEAR_AWAY
}
