/**
 * 毫秒计时器
 * @class Timer
 * @classdesc 基于Date.now()实现的毫秒级计时器，支持启动、暂停、获取、设置时间
 */
export class Timer {
  /**
   * 构造函数，创建计时器实例
   * @constructor
   */
  constructor() {
    /**
     * 累计基准时间（包含所有暂停前的时间）
     * @type {number}
     * @private
     */
    this.baseTime = 0;

    /**
     * 当前计时周期的开始时间戳
     * @type {number}
     * @private
     */
    this.startTime = 0;

    /**
     * 计时器运行状态标志
     * @type {boolean}
     * @private
     */
    this.isRunning = false;
  }

  /**
   * 启动/恢复计时器
   * @method start
   * @desc 如果计时器未运行，则开始新的计时周期或继续暂停的计时
   * @example
   * timer.start(); // 开始计时
   */
  start() {
    if (!this.isRunning) {
      this.startTime = Date.now();
      this.isRunning = true;
    }
  }

  /**
   * 获取时间
   * @method getTime
   * @desc 返回精确到毫秒的累计时间，运行时动态计算时间差
   * @returns {number} 毫秒为单位的累计时间
   * @example
   * const elapsed = timer.getTime(); // 获取已过时间
   */
  getTime() {
    return this.isRunning 
      ? this.baseTime + (Date.now() - this.startTime)
      : this.baseTime;
  }

  /**
   * 暂停计时器
   * @method pause
   * @desc 暂停计时并冻结当前时间，后续可通过start()恢复计时
   * @example
   * timer.pause(); // 暂停计时
   */
  pause() {
    if (this.isRunning) {
      this.baseTime += Date.now() - this.startTime;
      this.isRunning = false;
    }
  }

  /**
   * 设置时间
   * @method setTime
   * @param {number} time - 要设置的毫秒时间戳
   * @desc 直接修改计时器基准时间，运行时会保持时间连续性
   * @example
   * timer.setTime(1000); // 设置为1秒
   */
  setTime(time) {
    this.baseTime = time;
    if (this.isRunning) {
      this.startTime = Date.now();
    }
  }

  /**
   * 重置计时器
   * @method reset
   * @desc 将时间归零并强制停止计时
   * @example
   * timer.reset(); // 完全重置计时器
   */
  reset() {
    this.baseTime = 0;
    this.startTime = 0;
    this.isRunning = false;
  }
}
